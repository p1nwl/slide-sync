import type { User } from "../types/index";

interface UserListProps {
  users: User[];
  currentUserId: string;
  isCreator: boolean;
  onChangeUserRole: (userId: string, role: "editor" | "viewer") => void;
}

export const UserList = ({
  users,
  currentUserId,
  isCreator,
  onChangeUserRole,
}: UserListProps) => {
  return (
    <div className="p-4">
      <h2 className="text-lg font-semibold mb-4">Users ({users.length})</h2>
      <div className="space-y-2">
        {users.map((user) => (
          <div
            key={user.id}
            className={`flex items-center justify-between p-2 rounded ${
              user.id === currentUserId
                ? "bg-blue-50 border border-blue-200"
                : "bg-gray-50"
            }`}
          >
            <div>
              <div className="font-medium">{user.nickname}</div>
              <div className="text-xs text-gray-500 capitalize">
                {user.role}
              </div>
            </div>

            {isCreator && user.id !== currentUserId && (
              <select
                value={user.role}
                onChange={(e) =>
                  onChangeUserRole(
                    user.id,
                    e.target.value as "editor" | "viewer"
                  )
                }
                className="text-xs border border-gray-300 rounded px-1 py-0.5"
              >
                <option value="viewer">Viewer</option>
                <option value="editor">Editor</option>
              </select>
            )}

            {user.id === currentUserId && (
              <span className="text-xs text-blue-600">(You)</span>
            )}
          </div>
        ))}
      </div>
    </div>
  );
};
