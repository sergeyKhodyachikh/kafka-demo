const { Kafka } = require('kafkajs');

const kafka = new Kafka({
  clientId: 'init-service',
  brokers: ['kafka:9092'],
});

const admin = kafka.admin()

/**
 * @type {import('kafkajs').ITopicConfig[]}
 */
const requiredTopics =[
  {
    topic: 'task_created',
    numPartitions: 3,
    replicationFactor: 1,
    // configEntries: [
    //   {
    //     name: 'log.retention.hours',
    //     value: 168
    //   },
    //   {
    //     name: 'log.retention.bytes',
    //     value: -1
    //   },
    //   {
    //     name: 'log.segment.bytes',
    //     value: '1gb'
    //   },
    //   {
    //     name: 'log.sgment.ms',
    //     value: '1week '
    //   }
    // ]
  }
]

const initKafkaTopics = async () => {
  await admin.connect()
  const existingTopics = await admin.listTopics()
  const missingTopics = requiredTopics.filter(({topic}) => !existingTopics.includes(topic))
  if(missingTopics.length) {
    const isSuccessfull = await admin.createTopics({
      topics: missingTopics,
    //   topics: [
    //     {
    //       topic: 'task_created',
    //       numPartitions: 3,
    //       replicationFactor: 1,
    //       configEntries: [
    //         {
    //           name: 'log.retention.hours',
    //           value: 168
    //         },
    //         {
    //           name: 'log.retention.bytes',
    //           value: -1
    //         },
    //         {
    //           name: 'log.segment.bytes',
    //           value: '1gb'
    //         },
    //         {
    //           name: 'log.sgment.ms',
    //           value: '1week '
    //         }
    //       ]
    //     }
    //   ],
    })
    console.log(isSuccessfull);
  }
  await admin.disconnect()
}

initKafkaTopics()
