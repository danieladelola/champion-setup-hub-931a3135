import { getSettings, saveSettings } from "../src/lib/settings.server";

async function main() {
  const current = await getSettings();
  const oldAddress = current.contact.address;
  const newAddress = oldAddress.replace(/Peckham /g, "").replace(/Peckham/g, "");
  if (newAddress === oldAddress) {
    console.log("No 'Peckham' found in stored address. Nothing to update.");
    return;
  }
  await saveSettings({ contact: { address: newAddress } });
  console.log("Updated stored address from:");
  console.log(oldAddress);
  console.log("to:");
  console.log(newAddress);
}

main().catch((error) => {
  console.error("Failed to update address:", error);
  process.exit(1);
});
