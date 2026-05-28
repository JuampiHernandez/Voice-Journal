import { NextResponse } from "next/server";
import { isReadOnlyRuntime } from "@/lib/runtime";

export function rejectIfReadOnly(action = "This action"): NextResponse | null {
  if (!isReadOnlyRuntime()) return null;
  return NextResponse.json(
    {
      error: `${action} is only available on localhost. Clone the repo and run npm run dev:full to journal with voice.`,
      readOnly: true,
    },
    { status: 403 }
  );
}
