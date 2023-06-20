import hubspotClient from "../../clients/http/HubspotClient";

const FilterClient = (filter, sorts, propertiesToFilter ) => {
    const filterGroup = { filters: [filter] };
    const properties = propertiesToFilter;
    const limit = 100;
    const after = 0;
    let sorts_ = sorts;
    if(!sorts || sorts.lenght === 0) 
        sorts_ = [JSON.stringify({ propertyName: 'createdate', direction: 'DESCENDING' })];
    
    const publicObjectSearchRequest = {
        filterGroups: [filterGroup],
        sorts: sorts_,
        properties,
        limit,
        after,
    }
    return hubspotClient.crm.contacts.searchApi.doSearch(publicObjectSearchRequest);
}

export default FilterClient;