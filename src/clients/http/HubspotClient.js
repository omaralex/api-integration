const hubspot = require('@hubspot/api-client');

const HubspotClient = (() => {
  let instance;

  const createInstance = () => {
    const hubspotInstance = new hubspot.Client({ accessToken: process.env.ACCESS_TOKEN_HUBSPOT });
    return hubspotInstance;
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

export default HubspotClient.getInstance();