export type RenderStatus = "queued" | "processing" | "completed" | "failed";

export interface HfCreds {
  keyId: string;
  keySecret: string;
  base: string; // e.g. https://platform.higgsfield.ai
}

export interface RenderInput {
  /** Instruction to the model. */
  prompt: string;
  /** Public image URLs. [0] = placement composite, [1] = clean design (optional). */
  imageUrls: string[];
}

export interface SubmitResult {
  requestId: string;
  statusUrl?: string;
}

export interface PollResult {
  status: RenderStatus;
  resultUrl?: string;
  error?: string;
}

export interface RenderProvider {
  readonly name: string;
  submit(input: RenderInput, creds: HfCreds): Promise<SubmitResult>;
  poll(ref: { requestId: string; statusUrl?: string }, creds: HfCreds): Promise<PollResult>;
}
