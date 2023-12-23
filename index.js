async function loadBlocksFromJSON() {
  try {
    const response = await fetch("blocks.json");

    if (!response.ok) {
      throw new Error(`HTTP error! Status: ${response.status}`);
    }

    const contentType = response.headers.get("content-type");

    if (!contentType || !contentType.includes("application/json")) {
      throw new Error("Expected JSON response from the server");
    }

    return await response.json();
  } catch (error) {
    console.error("Error loading JSON:", error);
    return null;
  }
}

let fullness;

async function findOptimalPlacement(blocks, container) {
  blocks.sort((a, b) => b.width * b.height - a.width * a.height);

  const emptySpace = [
    { top: 0, left: 0, right: container.width, bottom: container.height },
  ];

  const blockCoordinates = [];

  for (const block of blocks) {
    const rotatedBlock = { ...block, rotation: 0 };

    for (let i = 0; i < emptySpace.length; i++) {
      const space = emptySpace[i];

      if (
        (rotatedBlock.width <= space.right - space.left &&
          rotatedBlock.height <= space.bottom - space.top) ||
        (rotatedBlock.height <= space.right - space.left &&
          rotatedBlock.width <= space.bottom - space.top)
      ) {
        const coordinates = {
          top: Math.max(space.top, 0),
          left: Math.max(space.left, 0),
          right: Math.min(space.left + rotatedBlock.width, container.width),
          bottom: Math.min(space.top + rotatedBlock.height, container.height),
          initialOrder: blocks.indexOf(block),
          rotation: rotatedBlock.rotation,
        };
        blockCoordinates.push(coordinates);

        emptySpace.splice(i, 1);

        if (rotatedBlock.width < space.right - space.left) {
          emptySpace.push({
            top: coordinates.top,
            left: coordinates.right,
            right: space.right,
            bottom: coordinates.bottom,
          });
        }

        if (rotatedBlock.height < space.bottom - space.top) {
          emptySpace.push({
            top: coordinates.bottom,
            left: space.left,
            right: space.right,
            bottom: space.bottom,
          });
        }

        break;
      }
    }
  }

  if (blockCoordinates.length !== blocks.length) {
    console.error("Error: Some blocks cannot fit into the container.");
    return null;
  }

  const totalBlockArea = blockCoordinates.reduce(
    (acc, block) =>
      acc + (block.right - block.left) * (block.bottom - block.top),
    0
  );

  const internalVoidArea = emptySpace.reduce(
    (acc, space) =>
      acc + (space.right - space.left) * (space.bottom - space.top),
    0
  );

  fullness = 1 - internalVoidArea / (internalVoidArea + totalBlockArea);
  console.log(fullness);
  return { fullness, blockCoordinates };
}

(async () => {
  const container = { width: 350, height: 350 };
  const blocks = await loadBlocksFromJSON();
  const result = await findOptimalPlacement(blocks, container);
  if (!result) {
    console.error("Could not place all blocks into the container.");
  }

  const containerElement = document.getElementById("container");
  const colorMap = {};

  for (const coordinates of result.blockCoordinates) {
    const blockSizeKey = `${coordinates.right - coordinates.left}x${
      coordinates.bottom - coordinates.top
    }`;

    const color = colorMap[blockSizeKey] || getRandomColor();
    colorMap[blockSizeKey] = color;

    const blockElement = document.createElement("div");
    blockElement.className = "block";
    blockElement.style.width = coordinates.right - coordinates.left + "px";
    blockElement.style.height = coordinates.bottom - coordinates.top + "px";
    blockElement.style.top = coordinates.top + "px";
    blockElement.style.left = coordinates.left + "px";
    blockElement.style.backgroundColor = color;

    blockElement.innerText = coordinates.initialOrder + 1;

    document.getElementById("fullness").innerHTML = "fullness" + " " + fullness;

    containerElement.appendChild(blockElement);
  }

  function getRandomColor() {
    const letters = "0123456789ABCDEF";
    let color = "#";
    for (let i = 0; i < 6; i++) {
      color += letters[Math.floor(Math.random() * 16)];
    }
    return color;
  }
})();
