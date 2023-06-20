import hubspotClient from "../../clients/http/HubspotClient";

const UpdateClient = (clientId, properties) => {
    const contactObj = {
        properties
    };
    return hubspotClient.crm.contacts.basicApi.update(clientId, contactObj);
}

export default UpdateClient;