<?php

namespace Database\Seeders;

use App\Models\Admin;
use App\Models\MeasurementTemplate;
use App\Models\ShopSettings;
use Illuminate\Database\Seeder;

class DatabaseSeeder extends Seeder
{
    public function run(): void
    {
        $this->seedAdmin();
        $this->seedShopSettings();
        $this->seedMeasurementTemplates();
    }

    private function seedAdmin(): void
    {
        Admin::query()->updateOrCreate(
            ['email' => env('ADMIN_EMAIL', 'admin@topmantailor.com')],
            [
                'password_hash' => bcrypt(env('ADMIN_PASSWORD', 'admin123')),
                'shop_name' => 'Top Man Tailor',
            ]
        );
    }

    private function seedShopSettings(): void
    {
        ShopSettings::query()->updateOrCreate(
            ['id' => 1],
            [
                'name' => 'Top Man Tailor',
                'theme_default' => 'dark',
            ]
        );
    }

    private function seedMeasurementTemplates(): void
    {
        foreach ($this->templates() as $key => $template) {
            MeasurementTemplate::query()->updateOrCreate(
                ['template_key' => $key],
                [
                    'label' => $template['label'],
                    'fields' => $template['fields'],
                ]
            );
        }
    }

    /**
     * Ported exactly from prototype/js/seed.js DEFAULT_TEMPLATES.
     */
    private function templates(): array
    {
        return [
            'shalwar-kameez-men' => [
                'label' => 'Shalwar Qameez',
                'fields' => [
                    ['key' => 'length', 'label' => 'Length', 'group' => 'Qameez'],
                    ['key' => 'shoulder', 'label' => 'Shoulder', 'group' => 'Qameez'],
                    ['key' => 'sleeves', 'label' => 'Sleeves', 'group' => 'Qameez'],
                    ['key' => 'collar', 'label' => 'Collar', 'group' => 'Qameez'],
                    ['key' => 'chest', 'label' => 'Chest', 'group' => 'Qameez'],
                    ['key' => 'waist', 'label' => 'Waist', 'group' => 'Qameez'],
                    ['key' => 'daman', 'label' => 'Daman', 'group' => 'Qameez'],
                    ['key' => 'shalwar', 'label' => 'Shalwar', 'group' => 'Shalwar'],
                    ['key' => 'pacha', 'label' => 'Pacha', 'group' => 'Shalwar'],
                ],
            ],
            'shalwar-kameez-women' => [
                'label' => "Women's Shalwar Kameez",
                'fields' => [
                    ['key' => 'qlength', 'label' => 'Qameez Length', 'group' => 'Qameez'],
                    ['key' => 'chest', 'label' => 'Chest / Bust', 'group' => 'Qameez'],
                    ['key' => 'waist', 'label' => 'Waist', 'group' => 'Qameez'],
                    ['key' => 'qSeat', 'label' => 'Hip / Seat', 'group' => 'Qameez'],
                    ['key' => 'shoulder', 'label' => 'Kandha (Shoulder)', 'group' => 'Qameez'],
                    ['key' => 'sleeve', 'label' => 'Sleeve Length', 'group' => 'Qameez'],
                    ['key' => 'bazu', 'label' => 'Bazu (Upper Arm)', 'group' => 'Qameez'],
                    ['key' => 'armhole', 'label' => 'Armhole', 'group' => 'Qameez'],
                    ['key' => 'cuff', 'label' => 'Wrist / Cuff', 'group' => 'Qameez'],
                    ['key' => 'neck', 'label' => 'Gala (Neck)', 'group' => 'Qameez'],
                    ['key' => 'frontLength', 'label' => 'Front Length', 'group' => 'Qameez', 'advanced' => true],
                    ['key' => 'backLength', 'label' => 'Back Length', 'group' => 'Qameez', 'advanced' => true],
                    ['key' => 'bicep', 'label' => 'Bicep', 'group' => 'Qameez', 'advanced' => true],
                    ['key' => 'elbow', 'label' => 'Elbow', 'group' => 'Qameez', 'advanced' => true],
                    ['key' => 'ghera', 'label' => 'Ghera (Flare / Bottom Width)', 'group' => 'Qameez', 'advanced' => true],
                    ['key' => 'slength', 'label' => 'Shalwar Length', 'group' => 'Shalwar'],
                    ['key' => 'shalwarWaist', 'label' => 'Waist', 'group' => 'Shalwar'],
                    ['key' => 'seat', 'label' => 'Hip / Seat', 'group' => 'Shalwar'],
                    ['key' => 'shalwarWidth', 'label' => 'Shalwar Width', 'group' => 'Shalwar'],
                    ['key' => 'mori', 'label' => 'Mori / Pauncha (Bottom Opening)', 'group' => 'Shalwar'],
                    ['key' => 'thigh', 'label' => 'Thigh', 'group' => 'Shalwar', 'advanced' => true],
                    ['key' => 'knee', 'label' => 'Knee', 'group' => 'Shalwar', 'advanced' => true],
                    ['key' => 'pocketDepthMeas', 'label' => 'Pocket Depth', 'group' => 'Shalwar', 'advanced' => true],
                    ['key' => 'waistbandHeight', 'label' => 'Waistband Height', 'group' => 'Shalwar', 'advanced' => true],
                ],
            ],
            'pant-shirt' => [
                'label' => 'Pant & Shirt',
                'fields' => [
                    ['key' => 'slength', 'label' => 'Shirt Length'],
                    ['key' => 'shoulder', 'label' => 'Shoulder'],
                    ['key' => 'chest', 'label' => 'Chest'],
                    ['key' => 'sleeve', 'label' => 'Sleeve'],
                    ['key' => 'collar', 'label' => 'Collar'],
                    ['key' => 'waist', 'label' => 'Waist'],
                    ['key' => 'plength', 'label' => 'Pant Length'],
                    ['key' => 'inseam', 'label' => 'Inseam'],
                ],
            ],
            'coat' => [
                'label' => 'Coat',
                'fields' => [
                    ['key' => 'clength', 'label' => 'Coat Length'],
                    ['key' => 'shoulder', 'label' => 'Shoulder'],
                    ['key' => 'chest', 'label' => 'Chest'],
                    ['key' => 'waist', 'label' => 'Waist'],
                    ['key' => 'sleeve', 'label' => 'Sleeve'],
                    ['key' => 'collar', 'label' => 'Collar'],
                ],
            ],
            'waistcoat' => [
                'label' => 'Waistcoat',
                'fields' => [
                    ['key' => 'wlength', 'label' => 'Waistcoat Length'],
                    ['key' => 'shoulder', 'label' => 'Shoulder'],
                    ['key' => 'chest', 'label' => 'Chest'],
                    ['key' => 'waist', 'label' => 'Waist'],
                ],
            ],
            'thobe' => [
                'label' => 'Thobe',
                'fields' => [
                    ['key' => 'tlength', 'label' => 'Thobe Length'],
                    ['key' => 'shoulder', 'label' => 'Shoulder'],
                    ['key' => 'chest', 'label' => 'Chest'],
                    ['key' => 'sleeve', 'label' => 'Sleeve'],
                    ['key' => 'neck', 'label' => 'Neck'],
                    ['key' => 'bottom', 'label' => 'Bottom'],
                ],
            ],
        ];
    }
}
