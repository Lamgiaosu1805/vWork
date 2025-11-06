const apiLive = "https://vWork.vnfite.com.vn"
const apiTest = "http://192.168.100.178:2345"

const BASE_URL = apiLive

const renderMaritalStatus = (number) => {
    if (number == 0) {
        return "Độc thân"
    }
    else if (number == 1) {
        return "Đã kết hôn"
    }
    else {
        return "Khác"
    }
}

const formatDate = (dateString) => {
    const date = new Date(dateString);
    const day = String(date.getDate()).padStart(2, "0");
    const month = String(date.getMonth() + 1).padStart(2, "0");
    const year = date.getFullYear();
    return `${day}/${month}/${year}`;
}

const getFileExtension = (fileURL) => {
    return {
        extension: fileURL.split('.').pop(),
        fileName: fileURL.split('/').pop()
    }
}


export default {
    BASE_URL,
    renderMaritalStatus,
    formatDate,
    getFileExtension
}