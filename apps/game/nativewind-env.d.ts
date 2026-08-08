/// <reference types="nativewind/types" />

/**
 * Déclaration de l'import CSS à effet de bord (`import '../global.css'` dans
 * app/_layout.tsx) — c'est lui qui déclenche la compilation NativeWind.
 *
 * `nativewind/types` ne la fournit pas, et `moduleResolution: bundler` refuse
 * un import sans déclaration : sans ce bloc, `tsc --noEmit` échoue sur
 * TS2882 alors que le bundle, lui, se construit très bien.
 */
declare module '*.css' {
  const content: string;
  export default content;
}
