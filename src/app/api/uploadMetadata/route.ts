import { NextResponse } from "next/server";

export async function POST(request: Request) {
  try {
    const body = await request.json();

    const options = {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${process.env.PINATA_JWT}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        pinataContent: body
      })
    };

    const res = await fetch('https://api.pinata.cloud/pinning/pinJSONToIPFS', options);
    const { IpfsHash } = await res.json();

    if (!IpfsHash) {
        throw new Error("Failed to pin JSON to Pinata");
    }

    return NextResponse.json({ success: true, ipfsHash: IpfsHash });

  } catch (error) {
    console.error("Error uploading metadata to Pinata:", error);
    return NextResponse.json({ success: false, message: "Error uploading metadata to Pinata." }, { status: 500 });
  }
}
