import { useThemedComponents } from '../../theme/ThemeProvider';

type PostProcessPanelProps = {
  title?: string;
  params: string[];
  labels: Record<string, string>;
  ranges: Record<string, { min: number; max: number; step: number }>;
  defaults: Record<string, number>;
  values: Record<string, number>;
  onChange: (key: string, value: number) => void;
};

export function PostProcessPanel({ title = 'Post Processing', params, labels, ranges, defaults, values, onChange }: PostProcessPanelProps) {
  const { Panel, Slider } = useThemedComponents();
  return (
    <Panel title={title} collapsible defaultCollapsed>
      {params.map(key => (
        <Slider
          key={key}
          label={labels[key]}
          value={values[key]}
          min={ranges[key].min}
          max={ranges[key].max}
          step={ranges[key].step}
          defaultValue={defaults[key]}
          onChange={v => onChange(key, v)}
        />
      ))}
    </Panel>
  );
}
