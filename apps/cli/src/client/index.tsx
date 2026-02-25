import { Visualization } from '@terraform-town/visualization';
import type { TerraformState, Resource } from '@terraform-town/visualization';

const root = document.getElementById('root')!;
const vis = new Visualization(root);

// Fetch initial state
const stateRes = await fetch('/state');
let currentState: TerraformState = await stateRes.json();
vis.update(currentState);

// Connect WebSocket
const wsProtocol = location.protocol === 'https:' ? 'wss:' : 'ws:';
const ws = new WebSocket(`${wsProtocol}//${location.host}/ws`);

ws.addEventListener('message', (event) => {
  const msg = JSON.parse(event.data);

  switch (msg.type) {
    case 'state':
      currentState = msg.data;
      vis.update(currentState);
      break;

    case 'resource': {
      const { address, action } = msg;
      const resourceState = actionToResourceState(action);
      if (resourceState) {
        currentState = updateResourceState(currentState, address, resourceState);
        vis.update(currentState);
      }
      break;
    }

    case 'done':
      // Server will send a fresh state snapshot after done
      break;
  }
});

ws.addEventListener('close', () => {
  console.log('[tftown] WebSocket closed, server may have stopped');
});

function actionToResourceState(action: string): Resource['state'] | null {
  switch (action) {
    case 'creating':
    case 'modifying':
    case 'refreshing':
    case 'importing':
    case 'reading':
      return 'planned';
    case 'created':
    case 'modified':
    case 'refreshed':
    case 'imported':
    case 'read':
      return 'applied';
    case 'destroying':
      return 'modified';
    case 'destroyed':
      return 'destroyed';
    case 'error':
      return 'error';
    default:
      return null;
  }
}

function updateResourceState(
  state: TerraformState,
  address: string,
  newState: Resource['state'],
): TerraformState {
  return {
    ...state,
    resources: state.resources.map((r) =>
      r.id === address ? { ...r, state: newState } : r,
    ),
  };
}
