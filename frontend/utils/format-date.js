const formatDate = (dateString) => {
    const d = new Date(dateString);
    const day = d.getDate();
    const month = d.toLocaleString('en-US', { month: 'short' }); 
    const year = d.getFullYear();
    return `${day} ${month} ${year}`;
};

export default formatDate;