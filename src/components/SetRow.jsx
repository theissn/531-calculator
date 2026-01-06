/**
 * SetRow Component - Display a single set
 */

export default function SetRow(props) {
  const textColor = props.isWarmup ? 'text-text-dim' : 'text-text'

  return (
    <div class={`flex items-center justify-between py-1 ${textColor}`}>
      <span class="w-16 text-sm text-text-dim">{props.set.percentage}%</span>
      <span class="flex-1 font-medium">{props.set.weight} {props.unit}</span>
      <span class="w-12 text-right">
        {props.set.isAmrap ? (
          <>×<span class="text-text-muted">{props.set.reps}</span></>
        ) : (
          <>×{props.set.reps}</>
        )}
      </span>
    </div>
  )
}
