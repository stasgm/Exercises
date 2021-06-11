import fetch from 'node-fetch';
/*
  Нужно реализовать функцию parallelLimit(urls, limit, callback), которая будет опрашивать список урлов (urls)

  Условия:
    - В один момент не допускается опрос более limit урлов, где limit - число параллельных запросов.
    к- Функция должна обладать мемоизацией, то есть опрошенные урлы не должны заново опрашиваться.
    - Для массива данных, полученных с помощью fetch запроса по урлу, должна быть вызвана функция callback.
    - Запросы делаем с помощью fetch
*/

interface IPlanet {
  name: string;
}

const sleep = (ms: number) => {
  return new Promise((resolve) => setTimeout(resolve, ms));
};

interface ICashRecord {
  request: string;
  response?: IPlanet;
}

function parallelLimit(urls: string[], limit: number, callback: (res?: IPlanet) => void) {
  // Группируем запросы по параметру limit
  const urlList: string[][] = [];

  for (let i = 0; i < urls.length; i = i + limit) {
    urlList.push(urls.slice(i, i + limit));
  }

  // Кэш данных с ответами
  const dataCash: ICashRecord[] = [];

  let a = 0;
  // Выполняем запроc по каждой группе urls
  (async (list) => {
    for await (const group of list) {
      console.log('\nGroup', ++a);
      const promises: Promise<ICashRecord>[] = [];

      group.forEach((url) => {
        const cahsedItem = dataCash.find((el) => el.request === url);

        dataCash.push({ request: url });

        let pr: Promise<ICashRecord>;

        if (cahsedItem) {
          console.log('cashed:', cahsedItem.request);
          pr = new Promise((r) => r(cahsedItem));
        } else {
          console.log('request:', url);
          pr = (async () => {
            const res = await fetch(url);
            const data = await res.json();

            const index = dataCash.findIndex((el) => el.request === url);
            dataCash[index] = { request: url, response: data };

            return { request: url, response: data };
          })();
        }

        promises.push(pr);
      });

      const res = await Promise.allSettled(promises);

      res.forEach((el) => {
        const curUrl = el.status === 'fulfilled' ? el.value.request : '';
        const item = dataCash.find((e) => e.request === curUrl);

        if (item?.response) {
          callback(item.response);
        } else {
          el.status === 'fulfilled' ? callback(el.value.response) : callback(el.reason);
        }
      });

      await sleep(1000);
    }
  })(urlList);
}

const urls = [
  'https://swapi.dev/api/planets/1/',
  'https://swapi.dev/api/planet/2/',
  'https://swapi.dev/api/planets/1/',
  'https://swapi.dev/api/planets/4/',
  'https://swapi.dev/api/planets/5/',
  'https://swapi.dev/api/planets/6/',
  'https://swapi.dev/api/planets/7/',
  'https://swapi.dev/api/planets/4/',
  'https://swapi.dev/api/planets/2/',
  'https://swapi.dev/api/planets/5/',
  'https://swapi.dev/api/planets/8/',
];

parallelLimit(urls, 3, (res) => {
  console.log(res?.name);
});
