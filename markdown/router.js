const $ = document.querySelectorAll.bind(document);
const getElementById = document.getElementById.bind(document)
const getElementsByTagName = document.getElementsByTagName.bind(document);

const pushHistory = (url) => {
  const inner = async () => {
    const markdownOnlyFile = url.endsWith('/') ? url + '_' : url + '/_';
    const resp = await fetch(markdownOnlyFile);
    if (!resp.ok) {
      throw new Error(`NetworkError: ${resp.statusText}`);
    }
    const text = await resp.text()
    const main = getElementById('main')
    if (!main) {
      throw new Error("Main does not exist");
    }

    main.innerHTML = text;
    const newRouterProps = JSON.parse((getElementById('router-props')).innerText)
    history.pushState(newRouterProps, '', url);

    const title = getElementsByTagName('title').item(0);
    const description = $("meta[name=description]")
    if (!title) {
      throw new Error("Title does not exist!")
    }
    if (!description) {
      throw new Error("Description does not exist")
    }
    title.innerText = newRouterProps.title;
    description.content = newRouterProps.content;
  }

  return inner().catch(e => {
    console.error(e)
    document.location = url
  })
}

document.body.addEventListener('click', event => {
  const target = event.target;
  if (target && target instanceof HTMLAnchorElement && location.hostname === new URL(target.href).hostname) {
    event.preventDefault();

    pushHistory(target.href)
  }
})
