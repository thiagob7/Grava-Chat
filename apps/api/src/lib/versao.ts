declare const __VERSION__: string | undefined;
declare const __BRANCH__: string | undefined;
declare const __BUILT_AT__: string | undefined;

const read = (value: string | undefined) => (value && value.length ? value : null);

export const apiVersion = {
  commit: typeof __VERSION__ === "string" ? read(__VERSION__) : null,
  branch: typeof __BRANCH__ === "string" ? read(__BRANCH__) : null,
  builtAt: typeof __BUILT_AT__ === "string" ? read(__BUILT_AT__) : null,
};
