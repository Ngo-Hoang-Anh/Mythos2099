import React from "react";
import ReactDOM from "react-dom/client";
import { isMobilePath, mobileShellRedirectHref } from "./boot/shell";
import { applyMobileFit, isMobileClient, readMobileClientHints } from "./ui/mobileFit";
import "./ui/styles.css";

function mount(node: React.ReactNode) {
  ReactDOM.createRoot(document.getElementById("root")!).render(
    <React.StrictMode>{node}</React.StrictMode>,
  );
}

const path = window.location.pathname;
const mobilePath = isMobilePath(path);
const mobileClient = isMobileClient(readMobileClientHints());
const redirectTo = mobileShellRedirectHref(mobileClient, {
  pathname: path,
  search: window.location.search,
  hash: window.location.hash,
});

if (redirectTo) {
  window.location.replace(redirectTo);
} else if (mobilePath) {
  document.documentElement.classList.add("is-mobile-shell");
  applyMobileFit();
  void import("./mobile/styles.css");
  void import("./mobile/MobileApp")
    .then(({ MobileApp }) => mount(<MobileApp />))
    .catch((err) => console.error("[boot] Failed to load MobileApp", err));
} else {
  document.documentElement.classList.remove("is-mobile-shell", "is-mobile-fit", "is-portrait-mobile");
  void import("./ui/App")
    .then(({ App }) => mount(<App />))
    .catch((err) => console.error("[boot] Failed to load App", err));
}
