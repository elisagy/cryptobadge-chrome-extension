'use strict';
var keyFrameNotLoaded = false;
try {
    const styleSheet = document.styleSheets[0];
    const keyframes = `
      @keyframes cryptoBadgeOpacityToggle {
        0%, 100% {
          opacity: 1;
        }
        50% {
          opacity: 0.5;
        }
      }
    `;
    styleSheet.insertRule(keyframes, styleSheet.cssRules.length);
}
catch (e) {
    keyFrameNotLoaded = true;
}

const regex = {
    eth: /(0x[A-Fa-f0-9]{40})/g,
    doge: /(D{1}[5-9A-HJ-NP-U]{1}[1-9A-HJ-NP-Za-km-z]{32})/g,
    btc: /((bc1|[13])[a-zA-HJ-NP-Z0-9]{25,39})/g,
},
    addresses = {},
    openBubbles = [],
    prices = [],
    infoElement = document.createElement("div"),
    addressesDone = [];
var infoElementTimeout;

function closeAllBubbles() {
    while (openBubbles.length) {
        const openBubble = openBubbles.pop();
        openBubble.element.style.setProperty("display", "none", "important");
        openBubble.timeout && clearTimeout(openBubble.timeout);
    }
}

function updateInfoBubble() {
    if (infoElement.getElementsByTagName("span")[0]) {
        infoElement.getElementsByTagName("span")[0].innerHTML = `Loaded ${addressesDone.length} out of ${Object.keys(addresses).length} addresses info`;
    }
    if (addressesDone.length < Object.keys(addresses).length) {
        if (infoElement.style.display === "none") {
            infoElement.style.setProperty("display", "block", "important");
        }
        infoElementTimeout && clearTimeout(infoElementTimeout) && (infoElementTimeout = null);
        infoElementTimeout = setTimeout((infoElement) => infoElement.style.setProperty("display", "none", "important"), 1000, infoElement);
    }
    else {
        infoElementTimeout && clearTimeout(infoElementTimeout) && (infoElementTimeout = null);
        if (infoElement.style.display !== "none") {
            infoElement.style.setProperty("display", "none", "important");
        }
    }
}

(async (prices) => {
    try {
        const response = await fetch(`https://api.blockchain.com/v3/exchange/tickers`);
        for (const price of await response.json()) {
            prices.push(price);
        }
    }
    catch (err) {
    }
})(prices);

function htmlStringToNodesArray(htmlString) {
    let parser = new DOMParser();
    let doc = parser.parseFromString(htmlString, 'text/html');
    return Array.from(doc.body.childNodes);
}

function replaceTextNodes(node, symbol) {
    if (["script", "style"].includes(node.tagName?.toLowerCase()) || node.getAttribute?.("crypto-badge-data") === "true") {
        return;
    }

    var timeout;
    node.childNodes.forEach(function (el) {
        if (el?.nodeType === 3) {
            if (el.nodeValue.trim().match(regex[symbol])) {
                const parentNode = el.parentNode;
                el.replaceWith(...htmlStringToNodesArray(el.nodeValue.trim().replace(regex[symbol], `<span crypto-badge-data="true">$1</span>`)));

                timeout && clearTimeout(timeout);
                timeout = setTimeout(() => {
                    for (const addressSpan of parentNode.querySelectorAll('[crypto-badge-data="true"]')) {
                        const address = addressSpan.innerText.trim();

                        if (!addresses[address]) {
                            addresses[address] = (async (address) => {
                                try {
                                    const response = await fetch(`https://api.cryptobadge.info/${symbol}/addresses/${address.trim()}`);
                                    return await response.json();
                                }
                                catch (err) {
                                    return null;
                                }
                            })(address);

                            updateInfoBubble();
                        }

                        const badgeElement = document.createElement("img");
                        badgeElement.setAttribute("src", "data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAwAAAAMCAMAAABhq6zVAAABfWlDQ1BpY2MAACiRfZE9SMNAHMVfU6WiFQcriDhkqE4WREV0K1UsgoXSVmjVweTSD6FJQ5Li4ii4Fhz8WKw6uDjr6uAqCIIfIM4OToouUuL/kkKLGA+O+/Hu3uPuHSDUy0w1O6KAqllGKh4Ts7kVMfCKIHowgFmMS8zUE+mFDDzH1z18fL2L8Czvc3+OXiVvMsAnEkeZbljE68TTm5bOeZ84xEqSQnxOPGbQBYkfuS67/Ma56LDAM0NGJjVHHCIWi20stzErGSrxFHFYUTXKF7IuK5y3OKvlKmvek78wmNeW01ynOYw4FpFAEiJkVLGBMixEaNVIMZGi/ZiHf8jxJ8klk2sDjBzzqECF5PjB/+B3t2ZhcsJNCsaAzhfb/hgBArtAo2bb38e23TgB/M/AldbyV+rAzCfptZYWPgL6toGL65Ym7wGXO8Dgky4ZkiP5aQqFAvB+Rt+UA/pvge5Vt7fmPk4fgAx1tXQDHBwCo0XKXvN4d1d7b/+eafb3AzH0cvOJh2Q6AAAAIGNIUk0AAHomAACAhAAA+gAAAIDoAAB1MAAA6mAAADqYAAAXcJy6UTwAAAGeUExURfDDneyzedL//////+y0fO7Bme22fuy1gOe5qdh4/9G//+OqfuWugeOyleOqf+Wug+a2l+OWQOewfOi3hei3hOewfeWZR/DAmOiudevAlu3Ns+7Os+zCmuesc+29keercu3KrO7MsOmtd+ecS+u/lu3Cm+edT+qzg+/Osu/Qtuq0g+u7jOu6j+u6ieq5jOmyge7OtO7Nseiyf+SWP+zBmeWYQ+iveO7Lr+zKq+etdOKvkeesdOu+lezKru3LsOq9k+arcOW0k+KTPOWseOi2hOm4h+avfOKXRu7Qu+/Tvu3Quui+m+eveuq/murBnu7Tv+zOt+WyhuWxhueufum0i+m3j+i4ju7Svum+meezh+zAneu+mu3Co+zAn+i4kOrCn+/UwOi9mOu+m+7CnOmyf/DQu+7HrOu9mum9l+/Uwe7Svei6kOq9mu3Dnuqyg+/PuO7Jr+m8meWxgO3PuerBnee1i+u+nezBoe3FqevBpOa2kOnAnO7Ruuayg+axh+evgueyiOWziuSzhu7RvOi9l+Wsd+SvfejAnOzMtv///1ZUDUwAAABIdFJOUwAAAAAAAAAAAAAAAAAAAAAAJFuMjFskBFPC+fnCUwRS4OBQI8LCI1v5+VmMi4yMW/n5WyTCJFbj4lYHVsL5+cJUByRbjIxbJMqiZ/QAAAABYktHRAMRDEzyAAAACXBIWXMAAAsSAAALEgHS3X78AAAAB3RJTUUH6AwUCiYQ/7YIEAAAAcR6VFh0UmF3IHByb2ZpbGUgdHlwZSBpY2MAADiNpVPrzRwhDPxPFSnB+LmUsweLlP4biMFwr9wX6RRLqxVjGI/NkH7Xmn6NUMMEI/AErUrajIB5Qtr0MjYUZGNEkEOKnAhg1+Hp6t8NIAsAFf8gaVYyMuAmxCrB8mV0rzoU5Q00wnZX9mWkL/c3ddlGGoUyLpi9NW/L0KKlrCtBauYTgo2XI/DMrvfwcSz8rIFjTT7OOcZItMeBF/yqd9ye8C3I8UHEfjMhFfMaNoIf+Iz/sD8NqYbaYk07wT4LN8BqwdW94Lxx261xcria6Pst7ZusKnqJCO0DK+0EPkJg9xC7CBm3NhrV4TQ3l3pCfdMYMra1vmLPsITgIsB3AenfCvL5UCCwimEUm0UoijA7kfbxIPzLDwXweBJPMRwMbwZ2TykR4bMhM1SOk9KuPoJQ5trKVNhbgYnfzjz/bVWiVidRdRWfFGiPzujoQejv89M+5NJDUT/mbdy08kdCLDbzdsx/PpoDmt029zYH0Z48qsfkxdNiCFLmQQqbwSm3F99F0CaCk9o8KBwG41rnxlLKuSoEcZf6k+/2sN+uHfab+8t4/0H0asT0BxAFIGVzu65JAAAEUXpUWHRSYXcgcHJvZmlsZSB0eXBlIHhtcAAAWIXVWVtywzYM/OcpegSKIAHpOLIl/XWmnz1+d0HZoh05iauZVo4mUsIHsFgsQCUOf//5V/gDX5JTDnKVxXqL2qnoRYvlFDVpUdNBZ5lSmpfL5bKkhPFBM0eKScmTxDxZzIK1vQ4h9zYaNhaxMc8lK54wKIJNKckicxzlar2M1is26kRn2qXI3/WqswnnAj0ATdaFOGSsE/fljmQzg7GLY+rzVGIinoUwUgyIb/bvmKZcsHwwFewmkhSBJcGJylhSzlmfcNQ5QumDZVxRRvhezL/SbFiVZvdlaZFOBl74KcLFIgn3qRrBUwxcWg7aWZ8meuB8xdEiAQxwC+YSsDK0ASTMQLbOg5YElwWICA1EuAFejySSmTwhRx5Ai9+dzzd+A4iakfhFJ4TWA19kMM4Zxjj60olYBqtaoYTvvHznhFIyBIs1S8HKYExgQcQQFu1DXqCOfO3jgAv5GqbF4EauW464EPeCjYVqolmgrEi614EGmB0orh0vqxi8WED55qym4NFoeKCPydWbxH7J3bonbPR9L4FD6d9MN3qiRBcI9M4gqIEAAvysHHhGsMSbxdiMqnbSa4K8FU+UBYqgl+I/ZSkooS5NKBFMZ1QA7ScR4Z08DQLFYVl5gYsVJuwQyohKqMBSWjMxA4cjolclBj7hDN7hGY4icaDhiLBGgVXYLqYgbGGYBgI8gCZjOet6HwcFMNTuCSzXja/QEtbgyitTAn/JK1wRdAYa4FN2LPIT4bz4WEFjIzBSB7jkJOEeSTATu+Hy0hgBlZgQUi1VJgTrDIZYJ4Bp25a71sfclZgHbgACCmJnTYnQW8fGtvqop4PHjrhRG7K7LTsGHhXM1ypUsGokG3QjpOwNlQrhREH8uyjBAcrcpHbKO9ouAPAsTNeWpVvF3XLk6SD8ZnP3nNWA5ezHxRdiY2FCF71y+Q1HitVry9JagWNeD66g1VeX67NUsDwvhLLs8PR7YbKx0RU3MvR08VUcgYOw42FxFakN7xgPe9Zvh5IfS62ueXxKpcCGbRXXhftJisKzrp1sTzdoZWhnEMF2hvBsk9DmAkntvP3ntsl92Sbae80bV/qpuDQc7Wx4ahQv+wR6EzkyNgTvF5NnJN8bxcDSZI9i2WKM2irchCdaBzsF6m9VVNhHw9MOectmCBYqy16YFGbV13qubPqCof6pwobv+IHhngZbQXjLS6E+vsiN7xXLY4LT8irDnAs/66Q1sf+Sw5XhyZe/l9X3Rh5Pz2+Ojzprr7A//P71Xxp6FcxHhva7YD4ktH8TzFlDu8VyHkQHDO0n5kND+43KPia090vmxKEdrf8zhVZjOROiA4b2EvOxof2ssg8K7d2SOXVox+r/XKE9/S1yAkQHDH1NzP+N6IChn1T2UaG9VzInD+1I/Z8tNP8r+1SIDhh6Tswbtbb7uVfhf1X84wyz+plV+AfvTJmuUmuwCAAAAAFvck5UAc+id5oAAACkSURBVAjXY2BgZBIUEhYRFWNmYWVgE5eQlPLwlJaRlWNnYJZX8PL28fXzV1TiYFBWCQgMCg4JDQtXVWNQ14iIjIqOiY2L19Ri0E5ITEpOSU1Lz8jUYdDNys7JzcsvKCwq1mPQNygpLSuvqKyqNjRiMDapqa2rb2hs8lIxZeA0M29uaW1r97Kw5GLgtrK2se0IsLN3cORh4OVjdnJ2cXVzZ+YXAAAybyV2rcmI5AAAANBlWElmSUkqAAgAAAAKAAABBAABAAAAEAAAAAEBBAABAAAAEAAAAAIBAwADAAAAhgAAABIBAwABAAAAAQAAABoBBQABAAAAjAAAABsBBQABAAAAlAAAACgBAwABAAAAAgAAADEBAgANAAAAnAAAADIBAgAUAAAAqgAAAGmHBAABAAAAvgAAAAAAAAAIAAgACABIAAAAAQAAAEgAAAABAAAAR0lNUCAyLjEwLjM2AAAyMDI0OjEyOjEyIDAwOjA5OjUwAAEAAaADAAEAAAABAAAAAAAAAJVmPT0AAAAldEVYdGRhdGU6Y3JlYXRlADIwMjQtMTItMjBUMTA6Mzg6MDIrMDA6MDAVd44oAAAAJXRFWHRkYXRlOm1vZGlmeQAyMDI0LTEyLTIwVDEwOjM4OjAyKzAwOjAwZCo2lAAAACh0RVh0ZGF0ZTp0aW1lc3RhbXAAMjAyNC0xMi0yMFQxMDozODoxNiswMDowMAvaM8YAAAAadEVYdGV4aWY6Qml0c1BlclNhbXBsZQA4LCA4LCA4Eu0+JwAAABF0RVh0ZXhpZjpDb2xvclNwYWNlADEPmwJJAAAAIXRFWHRleGlmOkRhdGVUaW1lADIwMjQ6MTI6MTIgMDA6MDk6NTBxbQ6QAAAAE3RFWHRleGlmOkV4aWZPZmZzZXQAMTkwTI7zwgAAABN0RVh0ZXhpZjpJbWFnZUxlbmd0aAAxNni+YawAAAASdEVYdGV4aWY6SW1hZ2VXaWR0aAAxNtJaF8sAAAAadEVYdGV4aWY6U29mdHdhcmUAR0lNUCAyLjEwLjM29mgStgAAABt0RVh0aWNjOmNvcHlyaWdodABQdWJsaWMgRG9tYWlutpExWwAAACJ0RVh0aWNjOmRlc2NyaXB0aW9uAEdJTVAgYnVpbHQtaW4gc1JHQkxnQRMAAAAVdEVYdGljYzptYW51ZmFjdHVyZXIAR0lNUEyekMoAAAAOdEVYdGljYzptb2RlbABzUkdCW2BJQwAAAABJRU5ErkJggg==");
                        badgeElement.setAttribute("style", `${keyFrameNotLoaded ? "opacity: 0;" : "animation: cryptoBadgeOpacityToggle 1s infinite ease-in-out;" } cursor: pointer; margin: 0 0 4px 4px;`);
                        addressSpan.appendChild(badgeElement);

                        addresses[address]
                            .then(((badgeElement) => (data) => {
                                badgeElement.style.removeProperty("animation");
                                badgeElement.style.setProperty("opacity", data ? "1" : "0.5", "important");

                                const bubbleElement = document.createElement("div");
                                bubbleElement.setAttribute("crypto-badge-data", "true");
                                bubbleElement.setAttribute("style", `
                                    background-color: white !important;
                                    background-image: url("data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAADAAAAAwCAYAAABXAvmHAAAAv3pUWHRSYXcgcHJvZmlsZSB0eXBlIGV4aWYAAHjabVBBEsMgCLzzij5BARWfYxo70x/0+UUhaWy7GVZkmQ0C/fV8wG0AIwOnIrnmHBRcuWLTRIKhTY6BJ0+QS3pf6nAKqCX6dEr2/qMeTwM7mmbpYiR3F7ZVqOz+8mWEPtmYaOS7G1U3IjQhukGzZ4VcpVyfsPWwQixgEMs69s+96Pb2pP8hxE6RgjJRtgFoBAM1FdBYG8fXNIqytUZbyL89HYA32rtZClsFFzEAAAGFaUNDUElDQyBwcm9maWxlAAB4nH2RPUjDQBzFX1OlohUHK4g4ZKhOFkRFdCtVLIKF0lZo1cHk0g+hSUOS4uIouBYc/FisOrg46+rgKgiCHyDODk6KLlLi/5JCixgPjvvx7t7j7h0g1MtMNTuigKpZRioeE7O5FTHwiiB6MIBZjEvM1BPphQw8x9c9fHy9i/As73N/jl4lbzLAJxJHmW5YxOvE05uWznmfOMRKkkJ8Tjxm0AWJH7kuu/zGueiwwDNDRiY1RxwiFottLLcxKxkq8RRxWFE1yheyLiuctzir5Spr3pO/MJjXltNcpzmMOBaRQBIiZFSxgTIsRGjVSDGRov2Yh3/I8SfJJZNrA4wc86hAheT4wf/gd7dmYXLCTQrGgM4X2/4YAQK7QKNm29/Htt04AfzPwJXW8lfqwMwn6bWWFj4C+raBi+uWJu8BlzvA4JMuGZIj+WkKhQLwfkbflAP6b4HuVbe35j5OH4AMdbV0AxwcAqNFyl7zeHdXe2//nmn29wMx9HLz4hu/TwAADXZpVFh0WE1MOmNvbS5hZG9iZS54bXAAAAAAADw/eHBhY2tldCBiZWdpbj0i77u/IiBpZD0iVzVNME1wQ2VoaUh6cmVTek5UY3prYzlkIj8+Cjx4OnhtcG1ldGEgeG1sbnM6eD0iYWRvYmU6bnM6bWV0YS8iIHg6eG1wdGs9IlhNUCBDb3JlIDQuNC4wLUV4aXYyIj4KIDxyZGY6UkRGIHhtbG5zOnJkZj0iaHR0cDovL3d3dy53My5vcmcvMTk5OS8wMi8yMi1yZGYtc3ludGF4LW5zIyI+CiAgPHJkZjpEZXNjcmlwdGlvbiByZGY6YWJvdXQ9IiIKICAgIHhtbG5zOnhtcE1NPSJodHRwOi8vbnMuYWRvYmUuY29tL3hhcC8xLjAvbW0vIgogICAgeG1sbnM6c3RFdnQ9Imh0dHA6Ly9ucy5hZG9iZS5jb20veGFwLzEuMC9zVHlwZS9SZXNvdXJjZUV2ZW50IyIKICAgIHhtbG5zOmRjPSJodHRwOi8vcHVybC5vcmcvZGMvZWxlbWVudHMvMS4xLyIKICAgIHhtbG5zOkdJTVA9Imh0dHA6Ly93d3cuZ2ltcC5vcmcveG1wLyIKICAgIHhtbG5zOnRpZmY9Imh0dHA6Ly9ucy5hZG9iZS5jb20vdGlmZi8xLjAvIgogICAgeG1sbnM6eG1wPSJodHRwOi8vbnMuYWRvYmUuY29tL3hhcC8xLjAvIgogICB4bXBNTTpEb2N1bWVudElEPSJnaW1wOmRvY2lkOmdpbXA6ZTQxMDBkMWYtYWVlMi00YWMwLWE5MWEtZDdjOTNkM2VjZWQzIgogICB4bXBNTTpJbnN0YW5jZUlEPSJ4bXAuaWlkOmE3YTU0MTI2LTA3NTAtNGIzNi04NjhmLWJiNTViYzEzMzc5ZCIKICAgeG1wTU06T3JpZ2luYWxEb2N1bWVudElEPSJ4bXAuZGlkOjM0NTk5MGMyLTYzNzMtNGM3Mi04NzQ4LWQwZTYyZWQ1OThjYiIKICAgZGM6Rm9ybWF0PSJpbWFnZS9wbmciCiAgIEdJTVA6QVBJPSIyLjAiCiAgIEdJTVA6UGxhdGZvcm09IldpbmRvd3MiCiAgIEdJTVA6VGltZVN0YW1wPSIxNzMzOTU0ODU5MDIyODI4IgogICBHSU1QOlZlcnNpb249IjIuMTAuMzYiCiAgIHRpZmY6T3JpZW50YXRpb249IjEiCiAgIHhtcDpDcmVhdG9yVG9vbD0iR0lNUCAyLjEwIgogICB4bXA6TWV0YWRhdGFEYXRlPSIyMDI0OjEyOjEyVDAwOjA3OjM2KzAyOjAwIgogICB4bXA6TW9kaWZ5RGF0ZT0iMjAyNDoxMjoxMlQwMDowNzozNiswMjowMCI+CiAgIDx4bXBNTTpIaXN0b3J5PgogICAgPHJkZjpTZXE+CiAgICAgPHJkZjpsaQogICAgICBzdEV2dDphY3Rpb249InNhdmVkIgogICAgICBzdEV2dDpjaGFuZ2VkPSIvIgogICAgICBzdEV2dDppbnN0YW5jZUlEPSJ4bXAuaWlkOmE5Y2E2NWJmLTA1NTAtNGJiZC1iMGRhLTkxYTYzMTVhYzU4ZiIKICAgICAgc3RFdnQ6c29mdHdhcmVBZ2VudD0iR2ltcCAyLjEwIChXaW5kb3dzKSIKICAgICAgc3RFdnQ6d2hlbj0iMjAyNC0xMi0xMlQwMDowNzozOSIvPgogICAgPC9yZGY6U2VxPgogICA8L3htcE1NOkhpc3Rvcnk+CiAgPC9yZGY6RGVzY3JpcHRpb24+CiA8L3JkZjpSREY+CjwveDp4bXBtZXRhPgogICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgCiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAKICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIAogICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgCiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAKICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIAogICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgCiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAKICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIAogICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgCiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAKICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIAogICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgCiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAKICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIAogICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgCiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAKICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIAogICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgCiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAKICAgICAgICAgICAgICAgICAgICAgICAgICAgCjw/eHBhY2tldCBlbmQ9InciPz7WRjeZAAAABmJLR0QA/wD/AP+gvaeTAAAACXBIWXMAAAsTAAALEwEAmpwYAAAAB3RJTUUH6AwLFgcn1tKlIQAAEvtJREFUaN7tmmmUXVd1539nuPe+ueZBJWu2JMuSNVlgGQF2jC2wMATTzeAhJjRgmoaVifSCYEg6neAecNKD04GwGEzjmIC76RUsHIwtYwy2JCPJlmVZg0tSlaRSValeVb353emc0x+ecMKyaby8oJNeq8+X9+6Hd97+n332f//33hf+H1/iV7Hps3f+iVh6y/WLq4ce7Nc64wqXvvVscfHa8/9kAUw/+NnlafXsjYQzVyLkRpfWVjgTgwMhBc6BkD7o0gkh5CEyvT/2SyN/O7DjjtF/NADj3/mvea+271aXtj7o4rktorAKa2KEcOBChNeLDorgLGlUAxNiTYrwcgg0rnEcvNI+6ffekwxs/eqS7R9s/V8B0Jw8HNQf+XcfMfH8HfjFfmQRZ2JEWsZbcA26fyWyNITKFBB+DiHAxi1Mq05ancTOnSQ59whkFyGcw5kmmGZZ+t2f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") !important;
                                    background-position: top 8px right 8px;
                                    background-repeat: no-repeat !important;
                                    box-shadow: rgba(0, 0, 0, 0.35) 0px 5px 15px;
                                    border-radius: 8px !important;
                                    color: black !important;
                                    direction: ltr !important;
                                    display: none !important;
                                    font-family: \"Helvetica Neue\", Helvetica, Arial, sans-serif !important;
                                    font-size: 14px !important;
                                    line-height: ${data ? "1.5" : "3.5"}em !important;
                                    padding: 8px !important;
                                    min-height: 3.5em !important;
                                    position: fixed !important;
                                    right: 10px !important;
                                    top: 10px !important;
                                    text-align: left !important;
                                    ${data ? "" : "vertical-align: middle !important;"}
                                    width: 600px !important;
                                    z-index: 2147483647 !important;
                                `);
                                if (data) {
                                    const price = prices.find(({ symbol: priceSymbol }) => priceSymbol === `${symbol.toUpperCase()}-USD`),
                                        formatter = new Intl.NumberFormat("en-US", { style: "currency", currency: "USD", trailingZeroDisplay: "stripIfInteger" });
                                    bubbleElement.innerHTML = `<b style="pointer-events: none !important;">Address:</b> ${data.address}<br><b style="pointer-events: none !important;">Asset:</b> ${data.asset}<br><b style="pointer-events: none !important;">Balance:</b> ${data.balance}${price ? ` (~${formatter.format(price.last_trade_price * data.balance)})` : ``}<br><b style="pointer-events: none !important;">First Transaction Date:</b> ${(new Date(data.firstTransactionDate)).toString()}<br><b style="pointer-events: none !important;">Last Transaction Date:</b> ${(new Date(data.lastTransactionDate)).toString()}<br><b style="pointer-events: none !important;">Last Update:</b> ${(new Date(data.updatedDate)).toString()}${data.graphsDataURIs?.map(graphDataURI => `<br><br><img src="${graphDataURI}" style="pointer-events: none !important;">`).join("")}`;
                                }
                                else {
                                    bubbleElement.innerHTML = `<b style="pointer-events: none !important;">Error:</b> Could not query address ${address}`;
                                }

                                bubbleElement.onmouseover = e => {
                                    clearTimeout(openBubbles.find(({ element }) => element === e.target).timeout);
                                };
                                bubbleElement.onmouseout = closeAllBubbles;

                                badgeElement.onmouseover = e => {
                                    closeAllBubbles();
                                    bubbleElement.style.setProperty("display", "block", "important");
                                    openBubbles.push({ element: bubbleElement });
                                };
                                badgeElement.onmouseout = e => {
                                    openBubbles.find(({ element }) => element === bubbleElement).timeout = setTimeout((bubbleElement) => bubbleElement.style.setProperty("display", "none", "important"), 1000, bubbleElement);
                                };

                                document.body.appendChild(bubbleElement);
                            })(badgeElement))
                            .finally(() => {
                                if (!addressesDone.includes(address)) {
                                    addressesDone.push(address);
                                }
                                updateInfoBubble();
                            });

                        addressSpan.parentNode.setAttribute("crypto-badge-data", "true");
                    }
                }, 0);
                parentNode.setAttribute("crypto-badge-data", "true");
            }
        } else {
            replaceTextNodes(el, symbol);
        }
    });
}

for (const symbol in regex) {
    replaceTextNodes(document.body, symbol);
}

infoElement.setAttribute("crypto-badge-data", "true");
infoElement.setAttribute("style", `
    background-color: white !important;
    background-position: top 8px right 8px;
    background-repeat: no-repeat !important;
    bottom: 10px !important;
    box-shadow: rgba(0, 0, 0, 0.35) 0px 5px 15px;
    border-radius: 8px !important;
    color: black !important;
    direction: ltr !important;
    display: none !important;
    font-family: \"Helvetica Neue\", Helvetica, Arial, sans-serif !important;
    font-size: 14px !important;
    line-height: 1.5em; padding: 8px !important;
    pointer-events: none !important;
    position: fixed !important;
    right: 10px !important;
    text-align: left !important;
    z-index: 2147483647 !important;
`);
infoElement.innerHTML = `<img style="margin-bottom: 2px !important; pointer-events: none !important; vertical-align: middle !important;" src="data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAABAAAAAQCAYAAAAf8/9hAAAAwHpUWHRSYXcgcHJvZmlsZSB0eXBlIGV4aWYAAHjabVBBEsMgCLzzij4BAQ08xzR2pj/o84tBO7HtZliBdTYItNfzAbcOSgKSNy1WCjrExKh6ohioJyeUk0eBM1n68BHIW+wnR6ll3J/9hItTqp7li5Heh7Cvgsnw1y8jioP7RD0/hpENI6YQ0jCo8Swsptv1CXvDFRoBnUTXsX/qzbd3ZP8PEzVOjM7MJQbgHgJcXaBgv9i/6mHOmaeZL+TfnibgDdSlWQRcDVXTAAABhWlDQ1BJQ0MgcHJvZmlsZQAAeJx9kT1Iw0AcxV9TpaIVByuIOGSoThZERXQrVSyChdJWaNXB5NIPoUlDkuLiKLgWHPxYrDq4OOvq4CoIgh8gzg5Oii5S4v+SQosYD4778e7e4+4dINTLTDU7ooCqWUYqHhOzuRUx8IogejCAWYxLzNQT6YUMPMfXPXx8vYvwLO9zf45eJW8ywCcSR5luWMTrxNObls55nzjESpJCfE48ZtAFiR+5Lrv8xrnosMAzQ0YmNUccIhaLbSy3MSsZKvEUcVhRNcoXsi4rnLc4q+Uqa96TvzCY15bTXKc5jDgWkUASImRUsYEyLERo1UgxkaL9mId/yPEnySWTawOMHPOoQIXk+MH/4He3ZmFywk0KxoDOF9v+GAECu0CjZtvfx7bdOAH8z8CV1vJX6sDMJ+m1lhY+Avq2gYvrlibvAZc7wOCTLhmSI/lpCoUC8H5G35QD+m+B7lW3t+Y+Th+ADHW1dAMcHAKjRcpe83h3V3tv/55p9vcDMfRy8+Ibv08AAA12aVRYdFhNTDpjb20uYWRvYmUueG1wAAAAAAA8P3hwYWNrZXQgYmVnaW49Iu+7vyIgaWQ9Ilc1TTBNcENlaGlIenJlU3pOVGN6a2M5ZCI/Pgo8eDp4bXBtZXRhIHhtbG5zOng9ImFkb2JlOm5zOm1ldGEvIiB4OnhtcHRrPSJYTVAgQ29yZSA0LjQuMC1FeGl2MiI+CiA8cmRmOlJERiB4bWxuczpyZGY9Imh0dHA6Ly93d3cudzMub3JnLzE5OTkvMDIvMjItcmRmLXN5bnRheC1ucyMiPgogIDxyZGY6RGVzY3JpcHRpb24gcmRmOmFib3V0PSIiCiAgICB4bWxuczp4bXBNTT0iaHR0cDovL25zLmFkb2JlLmNvbS94YXAvMS4wL21tLyIKICAgIHhtbG5zOnN0RXZ0PSJodHRwOi8vbnMuYWRvYmUuY29tL3hhcC8xLjAvc1R5cGUvUmVzb3VyY2VFdmVudCMiCiAgICB4bWxuczpkYz0iaHR0cDovL3B1cmwub3JnL2RjL2VsZW1lbnRzLzEuMS8iCiAgICB4bWxuczpHSU1QPSJodHRwOi8vd3d3LmdpbXAub3JnL3htcC8iCiAgICB4bWxuczp0aWZmPSJodHRwOi8vbnMuYWRvYmUuY29tL3RpZmYvMS4wLyIKICAgIHhtbG5zOnhtcD0iaHR0cDovL25zLmFkb2JlLmNvbS94YXAvMS4wLyIKICAgeG1wTU06RG9jdW1lbnRJRD0iZ2ltcDpkb2NpZDpnaW1wOmZhOGI2NjhmLTI4NWYtNDUxMS1hNjQ3LWViMzViNmY5Nzc1NSIKICAgeG1wTU06SW5zdGFuY2VJRD0ieG1wLmlpZDoyOGY2MjhhNi0xMTMwLTRlMzgtYTg3Yy0zOWMwOTYzYjQxNGYiCiAgIHhtcE1NOk9yaWdpbmFsRG9jdW1lbnRJRD0ieG1wLmRpZDpjN2JhYmY1ZC04YWYyLTQwNjUtOGU0Yy01ZmU3NTI3MGZhYWQiCiAgIGRjOkZvcm1hdD0iaW1hZ2UvcG5nIgogICBHSU1QOkFQST0iMi4wIgogICBHSU1QOlBsYXRmb3JtPSJXaW5kb3dzIgogICBHSU1QOlRpbWVTdGFtcD0iMTczMzk1NDk5MjgyMTUwNyIKICAgR0lNUDpWZXJzaW9uPSIyLjEwLjM2IgogICB0aWZmOk9yaWVudGF0aW9uPSIxIgogICB4bXA6Q3JlYXRvclRvb2w9IkdJTVAgMi4xMCIKICAgeG1wOk1ldGFkYXRhRGF0ZT0iMjAyNDoxMjoxMlQwMDowOTo1MCswMjowMCIKICAgeG1wOk1vZGlmeURhdGU9IjIwMjQ6MTI6MTJUMDA6MDk6NTArMDI6MDAiPgogICA8eG1wTU06SGlzdG9yeT4KICAgIDxyZGY6U2VxPgogICAgIDxyZGY6bGkKICAgICAgc3RFdnQ6YWN0aW9uPSJzYXZlZCIKICAgICAgc3RFdnQ6Y2hhbmdlZD0iLyIKICAgICAgc3RFdnQ6aW5zdGFuY2VJRD0ieG1wLmlpZDo4NTk3MzhjYy0wOTQwLTRlOTItYjNiYS02ZjU1OWY3Y2I0YzEiCiAgICAgIHN0RXZ0OnNvZnR3YXJlQWdlbnQ9IkdpbXAgMi4xMCAoV2luZG93cykiCiAgICAgIHN0RXZ0OndoZW49IjIwMjQtMTItMTJUMDA6MDk6NTIiLz4KICAgIDwvcmRmOlNlcT4KICAgPC94bXBNTTpIaXN0b3J5PgogIDwvcmRmOkRlc2NyaXB0aW9uPgogPC9yZGY6UkRGPgo8L3g6eG1wbWV0YT4KICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIAogICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgCiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAKICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIAogICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgCiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAKICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIAogICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgCiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAKICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIAogICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgCiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAKICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIAogICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgCiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAKICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIAogICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgCiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAKICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIAogICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgCiAgICAgICAgICAgICAgICAgICAgICAgICAgIAo8P3hwYWNrZXQgZW5kPSJ3Ij8+3GOj2QAAAAZiS0dEAP8A/wD/oL2nkwAAAAlwSFlzAAALEwAACxMBAJqcGAAAAAd0SU1FB+gMCxYJNMzvyXEAAAMdSURBVDjLdZNNTFxVAIW/e9+bvwcMAwwCA53agK0gCjaFFA02BmJbY0yt/1FXNpIuakx3tmvcmXTTDYm1JiZY2VhNY5r4s2BR6Q/QVNDpotEyZRCG6ZThvfl5c+91YUKaFM/uJCdncXI+wf9o6dxbg8bP9gskxmqYTx6burpdTjxscrMXHe/6mTEZ6zsV3PFcXNY+hkDjF9bQ92ayunB73Is/P9H16qfeIwX56S8ai8tz3wW7Dg4H255CeXmquTR2bQPCDmPHWiinb1FOXZoOJfqONB4Yy20V3JmciESYv+wMfDhsZIDNhR8RlQJqdYZI9zuUVn8nEOsi3PUCQgiKMxPTTu/hF6O9h5UECBcvjtm7Roa1gc3rk+jyA0Q0STB5CO25RNoGMBUX7+a3aOUTfOKlYW/2qxMAEiDQ0Hsq1PE0pdQvYAnC0XbkRhq9vgilNdRqCmmHEaF6/KUbBFq7ETXtpwHkyoVPBkXzM82m7KLdDKGmPeiNNHUHjhPqeZPQ7kPUDLyHMArLiVNZmcPoKnZif/yfqRN7pSmm++2GDnTJRcR2Ygor1Ox9m40fTlK+9TUy7FBcuESg/Vko5rGbulGb60inCV3M75OmWsAYg6m4mOI6WmuQ1n/7Wg4Yg/E9ZNBBqyrFezOoQhaDBlVC4jw+rwpryLo4wihktI3Naxeoe+Vzwj1H0WWPSN/rVDIpTCiK7TRjNyTQ7jo6WDcvAFamTq7VDH8c35ydQisfy64FN4tRHlZdB8rLIWpb8Ct5Ak4TzpMjeL+dzba+caZZAqjc7Li//CfOnlFMIY3vrUH9DkRNK8ZoiCWplO9j3BXCOwfxM4uo+wufbR0pn7rilG5O/uTsOzZkpIW3eJlq/g7GzaCCUexwDKtxN86uIRDgXZu4EuocHW0aOOptXXnp+7NJ21v8Jth5cCiQ6EG5OdT6XbS0CTV2ICP1lJbm8P/6eZr6/vcTLx+/+whMS7+ed0Tqy49EtPe01b4/Hoh1IIShml+mmrmRrT74Y9zufG0iMTLmbUvjw/r73LuDlp/pF3YEFWyZT35wfluc/wU9M1dZ45VLUgAAAABJRU5ErkJggg=="> <span crypto-badge-data="true" style="pointer-events: none !important;"></span>`;
document.body.appendChild(infoElement);

const observer = new MutationObserver(function (mutationsList, observer) {
    for (let { target } of mutationsList) {
        if (target) {
            for (const symbol in regex) {
                replaceTextNodes(target, symbol);
            }
        }
    }
});
observer.observe(document.body, { childList: true, subtree: true });