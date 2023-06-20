export const toTimestamp = (strDate) => {
    const timeDate = new Date(strDate)
    const parsed = Date.UTC(timeDate.getFullYear(), timeDate.getMonth(), timeDate.getDate());
    return parsed;
}

export const getDateNow = () => {
    const timeDate = new Date()
    const parsed = Date.UTC(timeDate.getFullYear(), timeDate.getMonth(), timeDate.getDate());
    return parsed;
}