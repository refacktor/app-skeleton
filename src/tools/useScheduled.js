/**
 * # `useScheduled`
 *
 * ```javascript
 * const scheduleAction = useScheduled(action, minDelay);
 * ```
 *
 * Returns a function that will run an action _once_ a set amount of time after
 * the last invokation in a series of quick invokations, or upon component dismount,
 * whichever comes first.
 *
 * It's useful for things like on-change updating of remote resources, where the
 * changes come quickly, but you don't want to flood your server with requests.
 *
 * ## Example usage:
 *
 * ```javascript
 * const ArticleEditor = ({ articleId }) => {
 *   // ...
 *   const scheduleUpdate = useScheduled((event) => {
 *     const { name, value } = event.target;
 *     sendUpdateToServer({ name, value });
 *   }, { timeout: 5000 });
 *   // ...
 *   return html`
 *     <input name="title" value=${article.title} onKeyUp=${scheduleUpdate} />
 *   `;
 * };
 * ```
*/
import { useEffect } from 'preact/hooks';

export default (fn, timeout = 250) => {
  let handle = null;
  let params = null;
  const commit = () => {
    if (handle === null) return;
    clearTimeout(handle);
    handle = null;
    fn(...params);
    params = null;
  };
  useEffect(() => commit);
  return (...args) =>{
    params = args;
    if (handle !== null) clearTimeout(handle);
    handle = setTimeout(commit, timeout);
  };
};