import fs from "fs";
import Path from "path";

export const getElementAtIndex = <T>(
  index: number,
  array: T[]
): T | undefined =>
  array[((index % array.length) + array.length) % array.length];

export const getXPercentFromRange = (
  start: number,
  end: number,
  percentage: number
): number => start + ((end - start) * percentage) / 100;

export const getRandomArrayElement = <T>(arr: T[]): T => {
  if (arr.length === 0)
    throw new Error(
      "Invalid array length! Cannot choose random element from empty array"
    );
  if (arr.length === 1) return arr[0];
  return arr[Math.floor(Math.random() * arr.length)];
};

export const randomIntegerFromRange = (min: number, max: number): number =>
  Math.floor(Math.random() * (max - min + 1) + min);

export const cacheList = async (
  path: string,
  callbackOrData?:
    | ((data: Set<string>) => Set<string> | Promise<Set<string>>)
    | Set<string>
) => {
  if (!fs.existsSync(Path.dirname(path)))
    fs.mkdirSync(Path.dirname(path), { recursive: true });

  if (callbackOrData instanceof Set) {
    fs.writeFileSync(path, Array.from(callbackOrData).join("\n"));
    return callbackOrData;
  }

  let list = fs.existsSync(path)
    ? new Set(fs.readFileSync(path).toString().split("\n").filter(Boolean))
    : new Set<string>();

  if (typeof callbackOrData === "function") {
    list = await callbackOrData(list);
    fs.writeFileSync(path, Array.from(list).join("\n"));
  }

  return list;
};
