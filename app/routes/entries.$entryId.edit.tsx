import {type ActionArgs, type LoaderArgs, redirect} from "@remix-run/node";
import {useLoaderData, useNavigate} from "@remix-run/react";
import invariant from "tiny-invariant";

import {deleteEntry, updateEntry} from "~/biz/entry.server";
import {EntryForm} from "~/components/entry_form";
import {db} from "~/utils/prisma.server";
import {sleep} from "~/utils/sleep";

export async function loader({params}: LoaderArgs) {
  let {entryId} = params;
  if (!entryId || typeof entryId !== "string") {
    throw new Response("Non found", {status: 404});
  }
  let entry = await db.entry.findUnique({
    where: {
      id: parseInt(entryId, 10),
    },
  });
  if (entry === null) {
    throw new Response("Not found", {status: 404});
  }
  return {
    ...entry,
    date: entry.date.toISOString().substring(0, 10),
  };
}

export async function action({request, params}: ActionArgs) {
  let body = await request.formData();
  let id = params.entryId;
  let {date, type, text, _action} = Object.fromEntries(body);
  if (_action === "delete") {
    await deleteEntry(Number(id));
  } else {
    invariant(typeof text === "string");
    invariant(typeof type === "string");
    invariant(typeof date === "string");
    invariant(typeof id === "string");

    // simulate a slow request
    await sleep();
    await updateEntry({
      id,
      text,
      type,
      date,
    });
  }

  return redirect("/entries");
}

export default function Page() {
  let navigate = useNavigate();
  let entry = useLoaderData<typeof loader>();
  return (
    <div className="mb-5 max-w-xl">
      <EntryForm entry={entry} />
      <div className="mt-2">
        <button
          className="w-44 truncate  px-2 py-1 font-bold underline opacity-70 hover:opacity-100"
          onClick={() => {
            navigate(
              `/entries/${entry.id}/edit?open_modal=true&id=${entry.id}`
            );
          }}
        >
          Delete <span className="italic">{entry.text}</span>
        </button>
      </div>
    </div>
  );
}
