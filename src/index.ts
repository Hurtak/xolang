import xxx from "./module2";

function test(a: number): string {
  return String(a);
}

const res = test(5);
console.log(res);
console.log(xxx(123));
