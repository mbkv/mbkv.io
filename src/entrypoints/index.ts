import { $, createElement, getElementById, getElementsByTagName } from "../dom";

const setRoute = async (url: string) => {
  try {
    const markdownOnlyFile = url.endsWith("/") ? url + "_" : url + "/_";
    const resp = await fetch(markdownOnlyFile);
    if (!resp.ok) {
      throw new Error(`NetworkError: ${resp.statusText}`);
    }
    const newHtml = await resp.text();
    const main = getElementById("main");
    if (!main) {
      throw new Error("Main does not exist");
    }

    main.innerHTML = newHtml;

    for (const script of main.getElementsByTagName("script")) {
      const newScript = createElement("script");
      newScript.type = script.type;
      newScript.textContent = script.textContent;
      newScript.src = script.src;
      script.replaceWith(newScript);
    }

    const newRouterText = getElementById("router-props")!.innerText;
    if (!newRouterText) {
      throw new Error("Page didn't have props!")
    }
    const newRouterProps = JSON.parse(newRouterText);

    const title = getElementsByTagName("title").item(0);
    const description = $("meta[name=description]").item(0);
    if (!title) {
      throw new Error("Title does not exist!");
    }
    if (!description) {
      throw new Error("Description does not exist");
    }
    title.innerText = newRouterProps.title;
    (description as HTMLMetaElement).content = newRouterProps.content;
    return newRouterProps;
  } catch (e) {
    console.error(e);
    document.location = url;
  }
};

document.body.addEventListener("click", (event) => {
  const target = event.target;
  if (
    target &&
    target instanceof HTMLAnchorElement &&
    location.hostname === new URL(target.href).hostname
  ) {
    event.preventDefault();

    setRoute(target.href).then((newRouterProps) => {
      if (newRouterProps) {
        history.pushState(newRouterProps, "", target.href);
      }
    });
  }
});

window.addEventListener("popstate", () => {
  setRoute(document.location.href);
});
