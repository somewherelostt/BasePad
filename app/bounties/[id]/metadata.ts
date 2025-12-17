import type { Metadata } from "next";

interface GenerateMetadataProps {
  params: Promise<{ id: string }>;
}

export async function generateMetadata({
  params,
}: GenerateMetadataProps): Promise<Metadata> {
  const { id } = await params;

  // Fetch bounty data for OG image
  // Note: In production, you'd fetch from your API/database
  const baseUrl = process.env.NEXT_PUBLIC_APP_URL || "https://basepad.app";

  // Default OG image with bounty ID (the API will fetch actual data)
  const ogImageUrl = `${baseUrl}/api/og?bountyId=${id}`;

  return {
    title: "BASEPAD | BOUNTY DETAILS",
    description: "View bounty details and submit your work on BasePad",
    openGraph: {
      title: "BASEPAD | ONCHAIN BOUNTY",
      description: "Hunt this bounty and get paid onchain on BasePad",
      url: `${baseUrl}/bounties/${id}`,
      siteName: "BasePad",
      images: [
        {
          url: ogImageUrl,
          width: 1200,
          height: 630,
          alt: "BasePad Bounty",
        },
      ],
      type: "website",
    },
    twitter: {
      card: "summary_large_image",
      title: "BASEPAD | ONCHAIN BOUNTY",
      description: "Hunt this bounty and get paid onchain on BasePad",
      images: [ogImageUrl],
      creator: "@maaztwts",
    },
  };
}
