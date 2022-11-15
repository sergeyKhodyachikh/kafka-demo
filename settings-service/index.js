const { Kafka, PartitionAssigners } = require('kafkajs');

/** #region 
 test
 partitionAssigners: [PartitionAssigners.CooperativeStickyAssignor]
 rebalanced strategy is identical to StickAssignor (balanced like Round Robin, and then minimizes partition movements
  when consumer join/leave the group in order to minimize movements) but supports cooperative rebalance and therefore consumers can keep on consuming from the topic
#endregion */

const kafka = new Kafka({
  clientId: 'kafka-producer-service',
  brokers: ['kafka:9092'],
});

const consumer = kafka.consumer({
  groupId: 'deployment-name-11',
  allowAutoTopicCreation: false,
  heartbeatInterval:3000,
  sessionTimeout: 45000,
});

const consume = async () => {
  await consumer.connect();
  await consumer.subscribe({
    topic: 'task_created',
    fromBeginning: true,
    partitionAssigners: [PartitionAssigners.roundRobin],
  });

  await consumer.run({
    autoCommit: false,
    partitionsConsumedConcurrently: 1,
    eachBatchAutoResolve: false,
    eachBatch: async ({ batch, isRunning, isStale, commitOffsetsIfNecessary, resolveOffset, heartbeat }) => {
      const { messages, topic, partition } = batch
      console.log(`Reading ${messages.length} messages from ${partition} partition at the ${topic} topic.}`);
      for (let { attributes, key, offset,timestamp, value, headers, size } of messages) {
        if(!isRunning() || isStale()) break;
        try {
          console.log('offset', offset);
          console.log('key', key.toString());
          console.log('value', JSON.parse(value.toString()));
          console.log('headers', headers['system-id'].toString());
          console.log('timestamp', timestamp);
        console.log('attributes', attributes);
        console.log('size', size);
        // throw new Error('test')
        resolveOffset(offset)
        // await consumer.commitOffsets([{ offset, partition, topic }])
        await commitOffsetsIfNecessary(offset)
      } catch (error) {
        consumer.seek({ offset, partition, topic })
        } finally {
          await heartbeat()
        }
      }
      batch.messages.forEach(({ attributes, key, offset,timestamp, value, headers, size }) => {
        // console.log('attributes', attributes);
        // console.log('timestamp', timestamp);
        // console.log('value', JSON.parse(value.toString()));
        // console.log('headers', headers['system-id'].toString());
        // console.log('size', size);
        // console.log('key', key);
        // console.log('offset', offset);
        // console.log('timestamp', timestamp);
        // console.log('value', value);
        // console.log('headers', headers);
        // console.log('size', size);
      })
    }
  });
};

consume();

consumer.on('consumer.connect', console.log);

async function shutDown() {
  await consumer.disconnect();
}

process.on('SIGTERM', shutDown);
process.on('SIGINT', shutDown);
