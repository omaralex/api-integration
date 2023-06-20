import SQS from 'aws-sdk/clients/sqs.js';

const SqsClient = (() => {
  let instance;

  const createInstance = () => {
    const sqsInstance = new SQS({
      region: 'us-east-2',
    });

    return sqsInstance;
  };

  return {
    getInstance: () => {
      if (instance == null) {
        instance = createInstance();
      }
      return instance;
    }
  };
})();

export default SqsClient.getInstance();