import hubspotClient from "../../clients/http/HubspotClient";

const CreateClient = (params) => {
    const contactObj = {
        properties: params,
    }
    return hubspotClient.crm.contacts.basicApi.create(contactObj)
}

export default CreateClient;