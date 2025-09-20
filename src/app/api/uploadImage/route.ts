import { NextResponse } from "next/server";

export async function POST(request: Request) {
  try {
    const data = await request.formData();
    const file: File | null = data.get("file") as unknown as File;

    if (!file) {
      return NextResponse.json({ success: false, message: "No file found." });
    }

    const formData = new FormData();
    formData.append("file", file);

    const pinataMetadata = JSON.stringify({
      name: file.name,
    });
    formData.append("pinataMetadata", pinataMetadata);

    const pinataOptions = JSON.stringify({
      cidVersion: 0,
    });
    formData.append("pinataOptions", pinataOptions);

    const res = await fetch("https://api.pinata.cloud/pinning/pinFileToIPFS", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${process.env.PINATA_JWT}`,
      },
      body: formData,
    });

    const { IpfsHash } = await res.json();

    if (!IpfsHash) {
        throw new Error("Failed to pin file to Pinata");
    }

    return NextResponse.json({ success: true, ipfsHash: IpfsHash });

  } catch (error) {
    console.error("Error uploading to Pinata:", error);
    return NextResponse.json({ success: false, message: "Error uploading to Pinata." }, { status: 500 });
  }
}
