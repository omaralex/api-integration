import hubspotClient from "../../clients/http/HubspotClient";

const UpdateDeal = (id, params) => {
    const dealObj = {
        properties: params,
    }
    return hubspotClient.crm.deals.basicApi.update(id, dealObj)
}

export default UpdateDeal;