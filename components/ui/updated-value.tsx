import { EditButton } from "./edit-button";

interface UpdatedValueProps {
  oldValue?: string | number;
  newValue: string | number;
  onEdit: () => void;
  isEditable?: boolean;
  customButton?: React.ReactNode;
  postfix?: string;
}

export function UpdatedValue({
  oldValue,
  newValue,
  onEdit,
  isEditable = true,
  customButton,
  postfix,
}: UpdatedValueProps) {
  return (
    <div className="flex items-center ">
      <span className="flex items-center gap-2">
        {oldValue !== undefined && oldValue !== newValue ? (
          <>
            <span className="line-through text-muted-foreground">
              {oldValue}
            </span>
            {" → "}
            <span>
              {newValue}
              {postfix && (
                <span className="text-muted-foreground"> {postfix}</span>
              )}
            </span>
          </>
        ) : (
          <span>
            {newValue}
            {postfix && (
              <span className="text-muted-foreground"> {postfix}</span>
            )}
          </span>
        )}
      </span>
      {isEditable && (
        <div className="flex-shrink-0">
          <EditButton onClick={onEdit} customButton={customButton} />
        </div>
      )}
    </div>
  );
}
