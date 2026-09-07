import { useEffect, useMemo, useRef } from 'react'
import { MapContainer, Marker, Popup, TileLayer, useMap, useMapEvents } from 'react-leaflet'
import L from 'leaflet'
import type { Activity, Group, Location } from '../types'
import { UNGROUPED_COLOR } from '../types'

const THAILAND_CENTER: [number, number] = [13.5, 101.0]
const THAILAND_ZOOM = 6

interface Props {
  activities: Activity[]
  groups: Group[]
  focusId: string | null
  /** When set, clicking on empty map sets a location (used while the form is open). */
  onMapClick?: (loc: Location) => void
  pendingLocation: Location | null
  onMarkerClick: (id: string) => void
}

const iconCache = new Map<string, L.DivIcon>()
function pinIcon(color: string, highlighted: boolean): L.DivIcon {
  const key = `${color}:${highlighted}`
  let icon = iconCache.get(key)
  if (!icon) {
    const size = highlighted ? 22 : 16
    icon = L.divIcon({
      className: 'pin-icon',
      html: `<span style="display:block;width:${size}px;height:${size}px;border-radius:50%;background:${color};border:2px solid ${highlighted ? '#000' : '#fff'};box-shadow:0 1px 4px rgba(0,0,0,.5)"></span>`,
      iconSize: [size, size],
      iconAnchor: [size / 2, size / 2],
      popupAnchor: [0, -size / 2],
    })
    iconCache.set(key, icon)
  }
  return icon
}

const pendingIcon = L.divIcon({
  className: 'pin-icon',
  html: `<span style="display:block;width:18px;height:18px;border-radius:50%;background:#fff;border:3px dashed #333"></span>`,
  iconSize: [18, 18],
  iconAnchor: [9, 9],
})

function ClickHandler({ onMapClick }: { onMapClick?: (loc: Location) => void }) {
  useMapEvents({
    click(e) {
      if (!onMapClick) return
      const { lat, lng } = e.latlng
      onMapClick({ lat, lng, label: `${lat.toFixed(5)}, ${lng.toFixed(5)}` })
    },
  })
  return null
}

function FlyTo({ target }: { target: Activity | undefined }) {
  const map = useMap()
  useEffect(() => {
    if (!target) return
    const { lat, lng } = target.location
    map.flyTo([lat, lng], Math.max(map.getZoom(), 12), { duration: 0.8 })
  }, [target, map])
  return null
}

/** On first render, zoom to fit all activities (falls back to the Thailand default). */
function FitOnLoad({ activities }: { activities: Activity[] }) {
  const map = useMap()
  const done = useRef(false)
  useEffect(() => {
    if (done.current || activities.length === 0) return
    done.current = true
    const bounds = L.latLngBounds(activities.map((a) => [a.location.lat, a.location.lng] as [number, number]))
    map.fitBounds(bounds.pad(0.2), { maxZoom: 12 })
  }, [activities, map])
  return null
}

export default function TripMap({ activities, groups, focusId, onMapClick, pendingLocation, onMarkerClick }: Props) {
  const colorOf = useMemo(() => {
    const m = new Map(groups.map((g) => [g.id, g.color]))
    return (a: Activity) => (a.groupId && m.get(a.groupId)) || UNGROUPED_COLOR
  }, [groups])
  const nameOf = useMemo(() => new Map(groups.map((g) => [g.id, g.name])), [groups])
  const focused = activities.find((a) => a.id === focusId)

  return (
    <MapContainer
      center={THAILAND_CENTER}
      zoom={THAILAND_ZOOM}
      className={`trip-map ${onMapClick ? 'picking' : ''}`}
      scrollWheelZoom
    >
      <TileLayer
        attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
        url="https://tile.openstreetmap.org/{z}/{x}/{y}.png"
      />
      <ClickHandler onMapClick={onMapClick} />
      <FitOnLoad activities={activities} />
      <FlyTo target={focused} />
      {activities.map((a) => (
        <Marker
          key={a.id}
          position={[a.location.lat, a.location.lng]}
          title={a.name}
          alt={a.name}
          icon={pinIcon(colorOf(a), a.id === focusId)}
          eventHandlers={{ click: () => onMarkerClick(a.id) }}
        >
          <Popup>
            <div className="popup">
              {a.imageUrl && <img src={a.imageUrl} alt="" />}
              <strong>{a.name}</strong>
              {a.groupId && nameOf.get(a.groupId) && (
                <div className="badge" style={{ background: colorOf(a) }}>
                  {nameOf.get(a.groupId)}
                </div>
              )}
              {a.description && <p>{a.description}</p>}
              <div className="muted small">{a.location.label}</div>
            </div>
          </Popup>
        </Marker>
      ))}
      {pendingLocation && <Marker position={[pendingLocation.lat, pendingLocation.lng]} icon={pendingIcon} />}
    </MapContainer>
  )
}
