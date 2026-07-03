// This is another sample TypeScript file
// Located in a subdirectory

interface User {
  id: number;
  name: string;
}

function getUser(id: number): User {
  return {
    id,
    name: `User ${id}`,
  };
}

export { getUser, User };
