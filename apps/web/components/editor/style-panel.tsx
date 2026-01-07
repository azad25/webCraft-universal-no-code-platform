'use client';

import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Slider } from '@/components/ui/slider';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { ScrollArea } from '@/components/ui/scroll-area';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from '@/components/ui/collapsible';
import {
  Type,
  Palette,
  Image,
  Square,
  Layers,
  Move,
  ChevronDown,
  ChevronRight,
  Upload,
  Video,
  Sparkles
} from 'lucide-react';
import { cn } from '@/lib/utils';
import {
  GOOGLE_FONTS,
  FONT_WEIGHTS,
  FONT_SIZES,
  LINE_HEIGHTS,
  LETTER_SPACINGS,
  COLOR_PRESETS,
  GRADIENT_PRESETS,
  BORDER_STYLES,
  BORDER_RADIUS_PRESETS,
  SHADOW_PRESETS,
  WidgetStyle,
} from '@/lib/widget-styles';

interface StylePanelProps {
  style: WidgetStyle;
  onChange: (style: WidgetStyle) => void;
  onOpenMediaManager?: () => void;
}

function Section({ 
  title, 
  icon: Icon, 
  children, 
  defaultOpen = true 
}: { 
  title: string;
  icon: any;
  children: React.ReactNode;
  defaultOpen?: boolean;
}) {
  const [isOpen, setIsOpen] = useState(defaultOpen);

  return (
    <Collapsible open={isOpen} onOpenChange={setIsOpen}>
      <CollapsibleTrigger className="flex items-center justify-between w-full p-3 hover:bg-accent/50 transition-colors">
        <div className="flex items-center gap-2">
          <Icon className="w-4 h-4 text-muted-foreground" />
          <span className="font-medium text-sm">{title}</span>
        </div>
        {isOpen ? <ChevronDown className="w-4 h-4" /> : <ChevronRight className="w-4 h-4" />}
      </CollapsibleTrigger>
      <CollapsibleContent>
        <div className="px-3 pb-3 space-y-3">{children}</div>
      </CollapsibleContent>
    </Collapsible>
  );
}

function ColorPicker({ 
  value, 
  onChange, 
  label,
  showPresets = true 
}: { 
  value?: string;
  onChange: (color: string) => void;
  label: string;
  showPresets?: boolean;
}) {
  const allColors = [...COLOR_PRESETS.brand, ...COLOR_PRESETS.neutral, ...COLOR_PRESETS.colors];
  
  return (
    <div className="space-y-2">
      <Label className="text-xs">{label}</Label>
      <div className="flex items-center gap-2">
        <div className="relative w-8 h-8 rounded border overflow-hidden">
          <div className="absolute inset-0" style={{ backgroundColor: value || 'transparent' }} />
          <input
            type="color"
            value={value || '#000000'}
            onChange={(e) => onChange(e.target.value)}
            className="absolute inset-0 opacity-0 cursor-pointer"
          />
        </div>
        <Input
          value={value || ''}
          onChange={(e) => onChange(e.target.value)}
          className="flex-1 h-8 text-xs font-mono"
          placeholder="#000000"
        />
      </div>
      {showPresets && (
        <div className="flex gap-1 flex-wrap">
          {allColors.slice(0, 14).map((color) => (
            <button
              key={color.value}
              className={cn(
                "w-5 h-5 rounded border transition-transform hover:scale-110",
                value === color.value && "ring-2 ring-primary ring-offset-1"
              )}
              style={{ backgroundColor: color.value }}
              onClick={() => onChange(color.value)}
              title={color.name}
            />
          ))}
        </div>
      )}
    </div>
  );
}

export function StylePanel({ style, onChange, onOpenMediaManager }: StylePanelProps) {
  const updateTypography = (key: string, value: any) => {
    onChange({
      ...style,
      typography: { ...style.typography, [key]: value }
    });
  };

  const updateBackground = (updates: any) => {
    onChange({
      ...style,
      background: { ...style.background, ...updates }
    });
  };

  const updateBorder = (key: string, value: any) => {
    onChange({
      ...style,
      border: { ...style.border, [key]: value }
    });
  };

  return (
    <ScrollArea className="h-full">
      <div className="space-y-1">
        {/* Typography Section */}
        <Section title="Typography" icon={Type}>
          <div className="space-y-3">
            <div>
              <Label className="text-xs">Font Family</Label>
              <Select
                value={style.typography?.fontFamily || 'Inter'}
                onValueChange={(v) => updateTypography('fontFamily', v)}
              >
                <SelectTrigger className="h-8 text-xs">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <div className="text-xs text-muted-foreground px-2 py-1">Sans Serif</div>
                  {GOOGLE_FONTS.filter(f => f.category === 'sans-serif').map(font => (
                    <SelectItem key={font.value} value={font.value} style={{ fontFamily: font.value }}>
                      {font.name}
                    </SelectItem>
                  ))}
                  <div className="text-xs text-muted-foreground px-2 py-1 mt-2">Serif</div>
                  {GOOGLE_FONTS.filter(f => f.category === 'serif').map(font => (
                    <SelectItem key={font.value} value={font.value} style={{ fontFamily: font.value }}>
                      {font.name}
                    </SelectItem>
                  ))}
                  <div className="text-xs text-muted-foreground px-2 py-1 mt-2">Monospace</div>
                  {GOOGLE_FONTS.filter(f => f.category === 'monospace').map(font => (
                    <SelectItem key={font.value} value={font.value} style={{ fontFamily: font.value }}>
                      {font.name}
                    </SelectItem>
                  ))}
                  <div className="text-xs text-muted-foreground px-2 py-1 mt-2">Handwriting</div>
                  {GOOGLE_FONTS.filter(f => f.category === 'handwriting').map(font => (
                    <SelectItem key={font.value} value={font.value} style={{ fontFamily: font.value }}>
                      {font.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="grid grid-cols-2 gap-2">
              <div>
                <Label className="text-xs">Size</Label>
                <Select
                  value={style.typography?.fontSize || '1rem'}
                  onValueChange={(v) => updateTypography('fontSize', v)}
                >
                  <SelectTrigger className="h-8 text-xs">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {FONT_SIZES.map(size => (
                      <SelectItem key={size.value} value={size.value}>
                        {size.label} ({size.px})
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div>
                <Label className="text-xs">Weight</Label>
                <Select
                  value={style.typography?.fontWeight || '400'}
                  onValueChange={(v) => updateTypography('fontWeight', v)}
                >
                  <SelectTrigger className="h-8 text-xs">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {FONT_WEIGHTS.map(weight => (
                      <SelectItem key={weight.value} value={weight.value}>
                        {weight.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-2">
              <div>
                <Label className="text-xs">Line Height</Label>
                <Select
                  value={style.typography?.lineHeight || '1.5'}
                  onValueChange={(v) => updateTypography('lineHeight', v)}
                >
                  <SelectTrigger className="h-8 text-xs">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {LINE_HEIGHTS.map(lh => (
                      <SelectItem key={lh.value} value={lh.value}>{lh.label}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div>
                <Label className="text-xs">Letter Spacing</Label>
                <Select
                  value={style.typography?.letterSpacing || '0'}
                  onValueChange={(v) => updateTypography('letterSpacing', v)}
                >
                  <SelectTrigger className="h-8 text-xs">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {LETTER_SPACINGS.map(ls => (
                      <SelectItem key={ls.value} value={ls.value}>{ls.label}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>

            <ColorPicker
              label="Text Color"
              value={style.typography?.color}
              onChange={(v) => updateTypography('color', v)}
            />
          </div>
        </Section>

        {/* Background Section */}
        <Section title="Background" icon={Palette}>
          <div className="space-y-3">
            <div>
              <Label className="text-xs">Type</Label>
              <Select
                value={style.background?.type || 'none'}
                onValueChange={(v) => updateBackground({ type: v })}
              >
                <SelectTrigger className="h-8 text-xs">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="none">None</SelectItem>
                  <SelectItem value="color">Solid Color</SelectItem>
                  <SelectItem value="gradient">Gradient</SelectItem>
                  <SelectItem value="image">Image</SelectItem>
                  <SelectItem value="video">Video</SelectItem>
                </SelectContent>
              </Select>
            </div>

            {style.background?.type === 'color' && (
              <ColorPicker
                label="Background Color"
                value={style.background?.color}
                onChange={(v) => updateBackground({ color: v })}
              />
            )}

            {style.background?.type === 'gradient' && (
              <div className="space-y-2">
                <Label className="text-xs">Gradient Presets</Label>
                <div className="grid grid-cols-5 gap-1">
                  {GRADIENT_PRESETS.map((gradient) => (
                    <button
                      key={gradient.name}
                      className={cn(
                        "w-full aspect-square rounded border transition-transform hover:scale-105",
                        style.background?.gradient === gradient.value && "ring-2 ring-primary"
                      )}
                      style={{ background: gradient.value }}
                      onClick={() => updateBackground({ gradient: gradient.value })}
                      title={gradient.name}
                    />
                  ))}
                </div>
                <div>
                  <Label className="text-xs">Custom Gradient</Label>
                  <Input
                    value={style.background?.gradient || ''}
                    onChange={(e) => updateBackground({ gradient: e.target.value })}
                    className="h-8 text-xs font-mono"
                    placeholder="linear-gradient(135deg, #000 0%, #fff 100%)"
                  />
                </div>
              </div>
            )}

            {style.background?.type === 'image' && (
              <div className="space-y-2">
                <div className="flex gap-2">
                  <Input
                    value={style.background?.image?.url || ''}
                    onChange={(e) => updateBackground({ image: { ...style.background?.image, url: e.target.value } })}
                    className="flex-1 h-8 text-xs"
                    placeholder="Image URL"
                  />
                  <Button size="sm" variant="outline" onClick={onOpenMediaManager}>
                    <Upload className="w-4 h-4" />
                  </Button>
                </div>
                <div className="grid grid-cols-2 gap-2">
                  <div>
                    <Label className="text-xs">Size</Label>
                    <Select
                      value={style.background?.image?.size || 'cover'}
                      onValueChange={(v) => updateBackground({ image: { ...style.background?.image, size: v } })}
                    >
                      <SelectTrigger className="h-8 text-xs">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="cover">Cover</SelectItem>
                        <SelectItem value="contain">Contain</SelectItem>
                        <SelectItem value="auto">Auto</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  <div>
                    <Label className="text-xs">Position</Label>
                    <Select
                      value={style.background?.image?.position || 'center'}
                      onValueChange={(v) => updateBackground({ image: { ...style.background?.image, position: v } })}
                    >
                      <SelectTrigger className="h-8 text-xs">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="center">Center</SelectItem>
                        <SelectItem value="top">Top</SelectItem>
                        <SelectItem value="bottom">Bottom</SelectItem>
                        <SelectItem value="left">Left</SelectItem>
                        <SelectItem value="right">Right</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>
                <ColorPicker
                  label="Overlay Color"
                  value={style.background?.image?.overlay}
                  onChange={(v) => updateBackground({ image: { ...style.background?.image, overlay: v } })}
                  showPresets={false}
                />
              </div>
            )}

            {style.background?.type === 'video' && (
              <div className="space-y-2">
                <div className="flex gap-2">
                  <Input
                    value={style.background?.video?.url || ''}
                    onChange={(e) => updateBackground({ video: { ...style.background?.video, url: e.target.value } })}
                    className="flex-1 h-8 text-xs"
                    placeholder="Video URL"
                  />
                  <Button size="sm" variant="outline" onClick={onOpenMediaManager}>
                    <Video className="w-4 h-4" />
                  </Button>
                </div>
                <ColorPicker
                  label="Overlay Color"
                  value={style.background?.video?.overlay}
                  onChange={(v) => updateBackground({ video: { ...style.background?.video, overlay: v } })}
                  showPresets={false}
                />
              </div>
            )}
          </div>
        </Section>

        {/* Border Section */}
        <Section title="Border" icon={Square} defaultOpen={false}>
          <div className="space-y-3">
            <div className="grid grid-cols-2 gap-2">
              <div>
                <Label className="text-xs">Width</Label>
                <Input
                  value={style.border?.width || '0'}
                  onChange={(e) => updateBorder('width', e.target.value)}
                  className="h-8 text-xs"
                  placeholder="0px"
                />
              </div>
              <div>
                <Label className="text-xs">Style</Label>
                <Select
                  value={style.border?.style || 'solid'}
                  onValueChange={(v) => updateBorder('style', v)}
                >
                  <SelectTrigger className="h-8 text-xs">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {BORDER_STYLES.map(bs => (
                      <SelectItem key={bs.value} value={bs.value}>{bs.label}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>
            <ColorPicker
              label="Border Color"
              value={style.border?.color}
              onChange={(v) => updateBorder('color', v)}
            />
            <div>
              <Label className="text-xs">Border Radius</Label>
              <Select
                value={typeof style.border?.radius === 'string' ? style.border.radius : '0'}
                onValueChange={(v) => updateBorder('radius', v)}
              >
                <SelectTrigger className="h-8 text-xs">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {BORDER_RADIUS_PRESETS.map(br => (
                    <SelectItem key={br.value} value={br.value}>{br.label}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>
        </Section>

        {/* Shadow Section */}
        <Section title="Shadow" icon={Layers} defaultOpen={false}>
          <div>
            <Label className="text-xs">Shadow Preset</Label>
            <Select
              value={style.shadow || 'none'}
              onValueChange={(v) => onChange({ ...style, shadow: v })}
            >
              <SelectTrigger className="h-8 text-xs">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {SHADOW_PRESETS.map(shadow => (
                  <SelectItem key={shadow.label} value={shadow.value}>{shadow.label}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </Section>

        {/* Spacing Section */}
        <Section title="Spacing" icon={Move} defaultOpen={false}>
          <div className="space-y-3">
            <div>
              <Label className="text-xs mb-2 block">Padding</Label>
              <div className="grid grid-cols-4 gap-1">
                {['top', 'right', 'bottom', 'left'].map((side) => (
                  <div key={side} className="space-y-1">
                    <span className="text-[10px] text-muted-foreground uppercase">{side[0]}</span>
                    <Input
                      value={typeof style.padding === 'object' ? (style.padding as any)[side] || '0' : '0'}
                      onChange={(e) => {
                        const newPadding = typeof style.padding === 'object' ? { ...style.padding } : {};
                        (newPadding as any)[side] = e.target.value;
                        onChange({ ...style, padding: newPadding });
                      }}
                      className="h-7 text-xs text-center"
                    />
                  </div>
                ))}
              </div>
            </div>
            <div>
              <Label className="text-xs mb-2 block">Margin</Label>
              <div className="grid grid-cols-4 gap-1">
                {['top', 'right', 'bottom', 'left'].map((side) => (
                  <div key={side} className="space-y-1">
                    <span className="text-[10px] text-muted-foreground uppercase">{side[0]}</span>
                    <Input
                      value={typeof style.margin === 'object' ? (style.margin as any)[side] || '0' : '0'}
                      onChange={(e) => {
                        const newMargin = typeof style.margin === 'object' ? { ...style.margin } : {};
                        (newMargin as any)[side] = e.target.value;
                        onChange({ ...style, margin: newMargin });
                      }}
                      className="h-7 text-xs text-center"
                    />
                  </div>
                ))}
              </div>
            </div>
          </div>
        </Section>

        {/* Effects Section */}
        <Section title="Effects" icon={Sparkles} defaultOpen={false}>
          <div className="space-y-3">
            <div>
              <Label className="text-xs">Opacity</Label>
              <div className="flex items-center gap-2">
                <Slider
                  value={[style.opacity !== undefined ? style.opacity * 100 : 100]}
                  onValueChange={([v]) => onChange({ ...style, opacity: v / 100 })}
                  max={100}
                  step={1}
                  className="flex-1"
                />
                <span className="text-xs w-8 text-right">{Math.round((style.opacity ?? 1) * 100)}%</span>
              </div>
            </div>
          </div>
        </Section>
      </div>
    </ScrollArea>
  );
}
