// src/components/ItineraryEditOrder.jsx
import { closestCenter, DndContext, useDroppable } from "@dnd-kit/core";
import { SortableContext, useSortable, verticalListSortingStrategy } from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";

const FALLBACK_IMAGE = "https://images.unsplash.com/photo-1564507592333-c60657eea523";

const SortableAttraction = ({ attraction }) => {
	const { attributes, listeners, setNodeRef, transform, transition, isDragging } = useSortable({ id: attraction.id });
	const style = {
		transform: CSS.Transform.toString(transform),
		transition,
		opacity: isDragging ? 0.4 : 1,
	};

	return (
		<div
			ref={setNodeRef}
			style={style}
			{...attributes}
			{...listeners}
			className="bg-white rounded-xl shadow p-3 mb-3 flex items-center gap-3 cursor-grab active:cursor-grabbing border border-gray-200 touch-none"
		>
			<img
				src={attraction.image || FALLBACK_IMAGE}
				alt={attraction.name}
				className="w-14 h-14 rounded-lg object-cover flex-shrink-0"
			/>
			<div className="min-w-0">
				<p className="font-semibold text-gray-800 truncate">{attraction.name}</p>
				<p className="text-xs text-gray-500">{attraction.entry_fee || "N/A"}</p>
			</div>
		</div>
	);
};

const DroppableDayColumn = ({ dayKey, attractions }) => {
	const { setNodeRef } = useDroppable({ id: dayKey });

	return (
		<div
			ref={setNodeRef}
			className="bg-gray-50 rounded-xl p-4 flex-1 min-w-[260px]"
		>
			<h3 className="font-bold text-gray-700 mb-3">{dayKey}</h3>
			<SortableContext
				items={attractions.map((a) => a.id)}
				strategy={verticalListSortingStrategy}
			>
				<div className="min-h-[80px]">
					{attractions.map((attraction) => (
						<SortableAttraction
							key={attraction.id}
							attraction={attraction}
						/>
					))}
					{attractions.length === 0 && <p className="text-sm text-gray-400 italic">Drop an attraction here</p>}
				</div>
			</SortableContext>
		</div>
	);
};

const syncBadgeClass = (isSavingOrder, syncStatus) => {
	if (isSavingOrder) return "bg-yellow-100 text-yellow-700";
	if (syncStatus === "synced") return "bg-green-100 text-green-700";
	if (syncStatus === "connecting") return "bg-yellow-100 text-yellow-700";
	if (syncStatus === "error") return "bg-red-100 text-red-700";
	return "bg-gray-100 text-gray-500";
};

const syncBadgeText = (isSavingOrder, syncStatus) => {
	if (isSavingOrder) return "Saving…";
	if (syncStatus === "synced") return "Live synced";
	if (syncStatus === "connecting") return "Connecting…";
	if (syncStatus === "error") return "Sync unavailable";
	return "Offline";
};

// The full "Edit Order" panel: helper text + sync badge + the drag-and-drop
// day columns. Shared between ItineraryPage (owner) and PublicItineraryPage
// (share-link guest) so both render identically — the pages differ only in
// how they wire up useItineraryLiveEditing, not in what gets displayed.
const ItineraryEditOrder = ({ days, attractionsByDay, dndSensors, handleDragEnd, syncStatus, isSavingOrder, presenceCount }) => {
	return (
		<div className="print:hidden">
			<div className="flex items-center gap-2 mb-4 flex-wrap">
				<p className="text-sm text-gray-500">Drag attractions to reorder within a day or move them between days — changes save automatically.</p>
				<span className={`text-xs font-semibold px-2 py-0.5 rounded-full ${syncBadgeClass(isSavingOrder, syncStatus)}`}>{syncBadgeText(isSavingOrder, syncStatus)}</span>
				{syncStatus === "synced" && presenceCount > 1 && (
					<span className="text-xs font-semibold px-2 py-0.5 rounded-full bg-blue-100 text-blue-700">
						{presenceCount} people editing
					</span>
				)}
			</div>
			<DndContext
				sensors={dndSensors}
				collisionDetection={closestCenter}
				onDragEnd={handleDragEnd}
			>
				<div className="flex gap-4 flex-wrap">
					{days.map((dayKey) => (
						<DroppableDayColumn
							key={dayKey}
							dayKey={dayKey}
							attractions={attractionsByDay[dayKey] || []}
						/>
					))}
				</div>
			</DndContext>
		</div>
	);
};

export default ItineraryEditOrder;
