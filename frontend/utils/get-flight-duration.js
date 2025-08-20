const getFlightDuration = (departureTime, arrivalTime) => {
    const dep = new Date(departureTime);
    const arr = new Date(arrivalTime);
  
    const diffMs = arr - dep; // difference in ms
    const diffMins = Math.floor(diffMs / (1000 * 60)); // total minutes
    const hours = Math.floor(diffMins / 60);
    const minutes = diffMins % 60;
  
    return `${hours}h ${minutes}m`;
};

export default getFlightDuration;