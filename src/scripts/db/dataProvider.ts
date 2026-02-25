import * as CommonUtil from '../common.ts';

// export const host = '192.168.1.35';
// export const port = 4000;
// client needs to provide server host from client machine
// export const serverHost = `//${host}:${port}`;
// const hostUsed = `//${window.location.host}`;
// const srv = {
//     get serverHost() { return `${hostUsed.indexOf('pingmac') >= 0 ? hostUsed : '/api'}` }
// }

const headers = { 'Content-Type': 'application/json' };
export const apiBase =
    import.meta.env.MODE === 'development'
        ? '/api'
        : window.location.origin;

// export const mediaHost = `http://pingmac.local:8000`;
export const mediaHost = `http://localhost:8000`;
export const apiMediaBase = import.meta.env.MODE === 'development' ? '/apiMedia' : mediaHost;

export const fetchData = async (path: string, method = "GET", body: any = null) => {
    try {
        let options: RequestInit = { method, headers };// : { method, headers, body: JSON.stringify(body) };

        // Add body for POST & PUT requests
        if (body && (method === "POST" || method === "PUT")) {
            options.body = JSON.stringify(body);
        }

        // Perform fetch request
        const response = await fetch(`${apiBase}/${path}`, options);
        if (response.redirected) {
            redirectPage(response.url);
        } else {
            const parseResponseBody = async (): Promise<any> => {
                const rawText = await response.text();
                if (!rawText.trim()) {
                    return null;
                }
                try {
                    return JSON.parse(rawText);
                } catch {
                    return rawText;
                }
            };

            if (response.ok) {
                return await parseResponseBody();
            } else {
                let msg;
                let result: any = null;
                if (response.status === 404) {
                    // do not use 404 in server for custom error
                    msg = `Path: ${path}, Method: ${method}, Status: ${response.statusText}`;
                } else {
                    const responseData = await parseResponseBody();
                    if (responseData && typeof responseData === "object" && responseData.error) {
                        msg = `${responseData.error} - ${responseData.message}`;
                        result = responseData;
                    } else if (typeof responseData === "string" && responseData.trim()) {
                        msg = responseData;
                    } else {
                        msg = `Path: ${path}, Method: ${method}, Status: ${response.status} ${response.statusText}`;
                    }
                }
                showMessage(msg);
                return result;
            }
        }
    } catch (error) {
        const err = error as Error;
        showMessage(`${path} - ${err.message}`);
        return null;
    }
}
export const getSqlResult = (sql: string, method: string = 'GET') => {
    return fetchData(`sqlResult/${sql}`, method);
}
export const getCrumbs = async (path: string) => {
    const results = await fetchData(path);
    return convertCrumbTags(results);
}
/**
* Convert crumb left joined with tags int crumb with tag as an array
* [ {id: id1, tag: t1}, {id: id1, tag: t2}] into [{id: id1, tag: [t1, t2]}]
* @param {*} results 
* @returns 
*/
const convertCrumbTags = (results: any): CommonUtil.Crumb[] => {
    let data: Array<CommonUtil.Crumb> = [];
    if (!results) {
        return data;
    }

    const seenKeys = new Set();

    results.forEach((item: any) => {
        if (!seenKeys.has(item.id)) {
            // Add a new object for each unique key
            // data.push({ key: item.key, class: item.class ? [item.class] : [] });
            data.push({
                id: item.id,
                title: item.title,
                url: item.url,
                date: item.date,
                description: item.description,
                pin: item.pin,
                color: item.color,
                deleted: item.deleted,
                tags: item.tag_name ? [item.tag_name] : []
            })
            seenKeys.add(item.id);
        } else {
            // Append class to the existing object
            const existing = data.find(obj => obj.id === item.id);
            if (item.tag_name) {
                existing?.tags?.push(item.tag_name);
            }
        }
    });
    return data;
}

/**
 *  start public method 
*/
export const getUser = async () => {
    return await fetchData('user');
}
export const login = async (user: object) => {
    return await fetchData('login', 'POST', user);
}
export const getAuthUser = async () => {
    // return { userId: 2, userName: 'Ping' };
    return await fetchData('authUser');
}
export const getPopularTag = async (userId: number) => {
    return await fetchData(`popularTag/${userId}`);
}
export const getPinnedCrumb = async (userId: number) => {
    return await getCrumbs(`crumbPinned/${userId}`);
}
export const getDeletedCrumb = async (userId: number) => {
    return await getCrumbs(`crumbTagDeleted/${userId}`);
}
export const getAllCrumb = async (userId: number) => {
    return await getCrumbs(`crumbTag/${userId}`);
}
export const getImageCrumbTag = async (userId: number) => {
    return await getCrumbs(`imageCrumbTag/${userId}`);
}
export const getCrumbByTag = async (userId: number, tagName: string) => {
    return await getCrumbs(`crumbByTag/${tagName}/user/${userId}`);
}
export const getCrumbNoTag = async (userId: number) => {
    return await getCrumbs(`crumbNoTag/${userId}`);
}
export const getCrumbByDate = async (userId: number, date: string) => {
    return await getCrumbs(`crumbByDate/${date}/user/${userId}`);
}
export const getCrumbById = async (id: number) => {
    return await getCrumbs(`crumbById/${id}`);
}
export const getSearchCrumb = async (searchText: string) => {
    return await getCrumbs(`searchCrumb/${searchText}`);
}
export const getAllTags = async () => {
    const data = await fetchData(`allTag`);
    return data.map((item: any) => item.tag_name);
}
export const getUserTags = async (userId: number) => {
    const data = await fetchData(`tag/${userId}`);
    return data.map((item: any) => item.tag_name);
}
export const createCrumb = async (crumb: any) => {
    await fetchData('crumb', 'POST', crumb);
}
export const updateCrumb = async (crumb: any) => {
    await fetchData('crumb', 'PUT', crumb);
}
export const updatePin = async (id: number, pin: number) => {
    await fetchData('crumbPin', 'PUT', { id, pin });
}
export const deleteCrumbById = async (id: number) => {
    await fetchData(`crumb/${id}`, 'DELETE');
}
export const updateTag = async (newName: string, oldName: string) => {
    await fetchData('tag', 'PUT', { newName, oldName });
}
export const addImage = async (crumbId: number, imgUrls: string) => {
    await fetchData('image', 'POST', { crumbId, imgUrls });
}
export const getCrumbImage = async (id: number) => {
    return await fetchData(`image/${id}`);
}
export const deleteCrumbImage = async (id: number) => {
    await fetchData(`image/${id}`, 'DELETE');
}

export const getSymbolQuotes = async (tickers: Array<string>) => {
    const results = await fetchData(`price/${tickers.join(",")}`, 'GET');
    return results;
}
export const updateAllPrices = async () => {
    await fetchData('price', 'PUT');
}
export const getCurrentPrice = async (symbol: string) => {
    let result = await fetchData('price', 'PUT', { symbol });
    return result.price;
}

export const showMessage = (
    msg: string,
    msgId: string = "manageError",
    timeout: number = 50000
): void => {
    const elem = document.getElementById(msgId);
    if (!elem) {
        alert(`The error is ${msg}`);
    } else {
        elem.textContent = msg;
        setTimeout(() => {
            elem.textContent = "";
        }, msgId === "manageError" ? timeout : timeout * 10);
    }
};
export const resetError = () => {
    const manageError = document.getElementById("manageError");
    if (manageError) {
        manageError.textContent = "";
    }
}

// Redirect
export const redirectPage = (url: string, qStr = ''): void => {
    window.location.href = `${url}${qStr ? '?' : ''}${qStr}`;
};
