export const qs = <T = HTMLDivElement>(selector: string) => document.querySelector(selector)! as T;
export const qi = (selector: string) => qs<HTMLInputElement>(selector);

export async function fget(url: string) {
    const response = await fetch("/api/" + url);
    return await response.json();
}