export const isUrl = (str: string): boolean => {
    const urlPattern = /^(https?:\/\/)?(www\.)?[a-zA-Z0-9-]+\.[a-zA-Z]{2,}(\/.*)?$/;
    return urlPattern.test(str.trim());
};

export const extractPathFromUrl = (url: string): string => {
    try {
        const urlWithProtocol = url.startsWith('http') ? url : `https://${url}`;
        const urlObj = new URL(urlWithProtocol);
        return urlObj.pathname + urlObj.search + urlObj.hash;
    } catch {
        return url;
    }
};

export const toTitleCase = (str: string) => {
    return str ? str.replace(/\w\S*/g, (txt) => txt.charAt(0).toUpperCase() + txt.substr(1).toLowerCase()) : "";
};
