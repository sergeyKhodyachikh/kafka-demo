const { Kafka, CompressionTypes, Partitioners } = require('kafkajs');

const kafka = new Kafka({
  clientId: 'kafka-producer-service',
  brokers: ['kafka:9092'],
});

const producer = kafka.producer({
  allowAutoTopicCreation: false,
  // duplicates are not intreduced due to network retries
  idempotent: true,
  // ensure maximum preformance while keeping messages ordering
  maxInFlightRequests: 5,
  retry: {
    // Retry untill delivery timeout is reached
    retries: Number.MAX_SAFE_INTEGER,
    // Fail after retrying foor2 minutes
    timeout: 120000
  },
  // https://kafka.js.org/docs/producing#a-name-custom-partitioner-a-custom-partitioner
  createPartitioner: Partitioners.DefaultPartitioner
});

const produceMessage = async () => {
  await producer.connect();
  const [recordMetadata] = await producer.send({
    topic: 'task_created',
    // Ensure data us orioerly replicated before an ack is recived
    acks: -1,
    messages: [{
      key: 'key', value: JSON.stringify({
        test: '2Hello KafkaJS user!',
        order: 1
      }), 
      headers: {
        'correlation-id': '2bfb68bb-893a-423b-a7fa-7b568cad5b67',
        'system-id': 'my-system',
      },
      /**
       * The message key is used to decide which partition the message will be sent to.
       * This is important to ensure that messages relating to the same aggregate are processed in order.
       * For example, if you use an orderId as the key, you can ensure that all messages regarding that order will be processed in order.
       * By default, the producer is configured to distribute the messages with the following logic:
       * - If a partition is specified in the message, use it
       * - If no partition is specified but a key is present choose a partition based on a hash (murmur2) of the key
       * - If no partition or key is present choose a partition in a round-robin fashion
       */
      // partition: 1, you can choose which partiotion the message will be sent to
      // timestamp: Date.now()
    }],
    // Consider snappy, Much smaller preducer request size, better disk utilisation in kafka
    compression: CompressionTypes.GZIP,
  });

  // console.log(recordMetadata);

  const topicMessages = [
    {
      topic: 'topic-a',
      messages: [{ key: 'key', value: JSON.stringify({
        someKey: 'task_created',
        order: 2
      }) }],
    },
    {
      topic: 'topic-b',
      messages: [{ key: 'key', value: JSON.stringify({
        someKey: 'task_created',
        order: 3
      }) }],
    },
    {
      topic: 'topic-c',
      messages: [
        {
          key: 'key',
          value: JSON.stringify({
            someKey: 'task_created',
            order: 4
          }),
          headers: {
            'correlation-id': '2bfb68bb-893a-423b-a7fa-7b568cad5b67',
          },
        }
      ],
    }
  ]

  await producer.sendBatch([
    {
      acks: -1,
      compression: CompressionTypes.GZIP,
      topicMessages: topicMessages
    }
  ])

  await producer.disconnect();
};

setInterval(() => produceMessage(), 10000);
