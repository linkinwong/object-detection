{
    const task = (name) => {
        data = {"name":name,"type":"image","labels":[],"project_id":2,"target_storage":{"location":"local"},"source_storage":{"location":"local"}}
        return fetch("https://127.0.0.1:4000/api/tasks?org=", {
            "headers": {
                "accept": "application/json, text/plain, */*",
                "accept-language": "en,zh-CN;q=0.9,zh;q=0.8",
                "authorization": "Token b1e9831be7655c56b2a9551cbf7af912b7e9dddf",
                "content-type": "application/json",
                "priority": "u=1, i",
                "sec-ch-ua": "\"Not/A)Brand\";v=\"8\", \"Chromium\";v=\"126\", \"Google Chrome\";v=\"126\"",
                "sec-ch-ua-mobile": "?0",
                "sec-ch-ua-platform": "\"macOS\"",
                "sec-fetch-dest": "empty",
                "sec-fetch-mode": "cors",
                "sec-fetch-site": "same-origin",
                "x-csrftoken": "HPGohEXV63YWZdrVrw7gpO6LJS5JHYV4"
            },
            "referrer": "https://127.0.0.1:4000/tasks/create",
            "referrerPolicy": "strict-origin-when-cross-origin",
            "body": JSON.stringify(data),
            "method": "POST",
            "mode": "cors",
            "credentials": "include"
        });
    }

    for (let index = 0; index < 10; index++) {
        task(`test-task-${index + 1}`)
    }
}
