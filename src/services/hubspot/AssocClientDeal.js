import hubspotClient from "../../clients/http/HubspotClient";

const AssocContactDeal = (params) => {
    const dealId =  params.id_deal;
    const toObjectType = "contacts";
    const toObjectId = params.id_contact;
    const associationType = "deal_to_contact";

    return hubspotClient.crm.deals.associationsApi.create(dealId, toObjectType, toObjectId, associationType)
}

export default AssocContactDeal;