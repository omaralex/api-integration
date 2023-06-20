import hubspotClient from "../../clients/http/HubspotClient";

const CreateDeal = (params) => {
    const dealObj = {
        properties: params,
    }
    return hubspotClient.crm.deals.basicApi.create(dealObj)
}

export default CreateDeal;