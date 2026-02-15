import type { Metadata } from "next";
import GenerateClient from "./GenerateClient";

export const metadata: Metadata = {
    title: "Generate Your Dev Card | GitWrapped",
    description: "Create a Pokémon-style trading card from your GitHub profile. Embed it in your README.",
};

export default function GeneratePage() {
    return <GenerateClient />;
}
