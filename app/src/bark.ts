const dogBarkDataUrl = `${process.env.PUBLIC_URL}/audio/small-dog-barking-trimmed.wav`;
const dogBarkAudioElement = new Audio(dogBarkDataUrl);

export async function bark() {
  await dogBarkAudioElement.play();
}
