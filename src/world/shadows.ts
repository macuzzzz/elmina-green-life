/**
 * The shadow map is only re-rendered when something that casts shadows moved
 * (camera/sun, an animating object, newly mounted meshes). Anything that animates
 * a shadow caster calls `requestShadowUpdate()` on the frames it moves.
 */
export const shadowRequests = { frames: 4 };

export function requestShadowUpdate(frames = 1) {
  shadowRequests.frames = Math.max(shadowRequests.frames, frames);
}
