import dayjs from "dayjs";
import relativeTime from "dayjs/plugin/relativeTime";

dayjs.extend(relativeTime);

export function formatRelativeTime(value: string) {
  const date = dayjs(value);

  if (!date.isValid()) {
    return value;
  }

  return date.fromNow();
}
