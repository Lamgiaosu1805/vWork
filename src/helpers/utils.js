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

const getTypeLaborContract = (type) => {
    switch (type) {
        case "probation":
            return "Thử việc";
        case "fixed_term":
            return "Chính thức xác định thời hạn";
        case "indefinite_term":
            return "Chính thức không định thời hạn";

        default:
            return "Khác";
    }
}

const getStatusLaborContract = (status) => {
    switch (status) {
        case "active":
            return "Còn hiệu lực";
        case "expired":
            return "Đã hết hạn";
        case "terminated":
            return "Đã thanh lý";
        default:
            return "Không rõ";
    }
}


export default {
    BASE_URL,
    renderMaritalStatus,
    formatDate,
    getFileExtension,
    getStatusLaborContract,
    getTypeLaborContract
}