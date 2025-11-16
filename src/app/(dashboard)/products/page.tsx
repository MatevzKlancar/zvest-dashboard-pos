"use client";

import { useState, useMemo } from "react";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Tabs,
  TabsContent,
  TabsList,
  TabsTrigger,
} from "@/components/ui/tabs";
import { Input } from "@/components/ui/input";
import {
  BarChart,
  Bar,
  PieChart,
  Pie,
  Cell,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
} from "recharts";
import { useProductAnalytics } from "@/hooks/useAnalytics";
import { formatCurrency, formatDate } from "@/lib/utils";
import { exportChartDataToCSV } from "@/lib/export";
import {
  Package,
  TrendingUp,
  TrendingDown,
  AlertTriangle,
  ShoppingCart,
  DollarSign,
  Search,
  Download,
  Star,
  Clock,
  Zap,
  Coffee,
  Pizza,
  Wine,
  Info,
  Package2,
  Activity,
  Target,
  Award,
  Flame,
  CheckCircle,
  XCircle,
  Loader2,
  ShoppingBag,
  Layers,
} from "lucide-react";

// Category icons mapping
const categoryIcons: Record<string, any> = {
  coffee: Coffee,
  food: Pizza,
  drinks: Wine,
  beverage: Wine,
  default: Package2,
};

// Helper to get category icon
const getCategoryIcon = (category: string) => {
  const Icon = categoryIcons[category?.toLowerCase()] || categoryIcons.default;
  return Icon;
};

// Performance tier calculator based on actual data
const getPerformanceBadge = (performance: string) => {
  switch (performance) {
    case "best_seller":
      return { name: "Best Seller", color: "text-green-600", bg: "bg-green-50", icon: Flame };
    case "good":
      return { name: "Good", color: "text-blue-600", bg: "bg-blue-50", icon: Star };
    case "average":
      return { name: "Average", color: "text-gray-600", bg: "bg-gray-50", icon: Activity };
    case "slow":
      return { name: "Slow Mover", color: "text-yellow-600", bg: "bg-yellow-50", icon: Clock };
    case "dead_stock":
      return { name: "Dead Stock", color: "text-red-600", bg: "bg-red-50", icon: AlertTriangle };
    default:
      return { name: "Unknown", color: "text-gray-600", bg: "bg-gray-50", icon: Package };
  }
};

export default function ProductsPage() {
  const [period, setPeriod] = useState("30d");
  const [selectedCategory, setSelectedCategory] = useState<string | undefined>(undefined);
  const [sortBy, setSortBy] = useState<"units_sold" | "revenue" | "last_sold">("units_sold");
  const [searchTerm, setSearchTerm] = useState("");
  const [activeTab, setActiveTab] = useState("overview");

  // Fetch real product analytics data
  const { data: analyticsData, isLoading, error } = useProductAnalytics({
    period,
    category: selectedCategory,
    sort_by: sortBy,
    limit: 100,
  });

  // Filter products by search term
  const filteredProducts = useMemo(() => {
    if (!analyticsData?.products) return [];

    if (!searchTerm) return analyticsData.products;

    return analyticsData.products.filter(
      (product: any) =>
        product.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        product.pos_article_id?.toLowerCase().includes(searchTerm.toLowerCase())
    );
  }, [analyticsData, searchTerm]);

  // Get unique categories from data
  const categories = useMemo(() => {
    if (!analyticsData?.categories) return [];
    return analyticsData.categories.map((cat: any) => cat.category).filter(Boolean);
  }, [analyticsData]);

  // Prepare data for charts
  const categoryChartData = useMemo(() => {
    if (!analyticsData?.categories) return [];

    const colors = ["#0088FE", "#00C49F", "#FFBB28", "#FF8042", "#8884D8", "#82CA9D"];

    return analyticsData.categories.map((cat: any, index: number) => ({
      name: cat.category || "Other",
      value: cat.revenue,
      units: cat.units_sold,
      color: colors[index % colors.length],
    }));
  }, [analyticsData]);

  // Handle export
  const handleExport = () => {
    if (!analyticsData?.products) return;

    exportChartDataToCSV(
      analyticsData.products,
      "product-analytics",
      [
        { key: "rank", label: "Rank" },
        { key: "name", label: "Product Name" },
        { key: "category", label: "Category" },
        { key: "units_sold", label: "Units Sold" },
        { key: "total_revenue", label: "Revenue" },
        { key: "avg_price", label: "Avg Price" },
        { key: "performance", label: "Performance" },
        { key: "days_since_last_sale", label: "Days Since Last Sale" },
      ]
    );
  };

  if (error) {
    return (
      <div className="space-y-6">
        <Alert className="border-red-200 bg-red-50">
          <AlertTriangle className="h-4 w-4 text-red-600" />
          <AlertTitle className="text-red-900">Error Loading Product Data</AlertTitle>
          <AlertDescription className="text-red-700">
            Failed to load product analytics. Please try again later.
          </AlertDescription>
        </Alert>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-3xl font-bold text-gray-900">Product Analytics</h2>
          <p className="text-gray-600">
            Real-time product performance based on actual sales data
          </p>
        </div>
        <Button variant="outline" onClick={handleExport}>
          <Download className="h-4 w-4 mr-2" />
          Export Report
        </Button>
      </div>

      {/* Success Alert - Data is Real! */}
      <Alert className="border-green-200 bg-green-50">
        <CheckCircle className="h-4 w-4 text-green-600" />
        <AlertTitle className="text-green-900">Live Sales Data</AlertTitle>
        <AlertDescription className="text-green-700">
          Showing real product performance from your POS transaction line items.
          All metrics are based on actual sales data.
        </AlertDescription>
      </Alert>

      {/* Metrics Overview */}
      {isLoading ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-6 gap-4">
          {[...Array(6)].map((_, i) => (
            <Card key={i}>
              <CardHeader className="pb-2">
                <div className="h-4 w-20 bg-gray-200 rounded animate-pulse" />
              </CardHeader>
              <CardContent>
                <div className="h-8 w-16 bg-gray-200 rounded animate-pulse" />
              </CardContent>
            </Card>
          ))}
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-6 gap-4">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Total Products</CardTitle>
              <Package className="h-4 w-4 text-gray-600" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">
                {analyticsData?.summary?.total_products || 0}
              </div>
              <p className="text-xs text-gray-500 mt-1">In catalog</p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Products Sold</CardTitle>
              <Activity className="h-4 w-4 text-green-600" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">
                {analyticsData?.summary?.products_sold_in_period || 0}
              </div>
              <p className="text-xs text-gray-500 mt-1">In {period}</p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Total Revenue</CardTitle>
              <DollarSign className="h-4 w-4 text-blue-600" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">
                {formatCurrency(analyticsData?.summary?.total_revenue || 0)}
              </div>
              <p className="text-xs text-gray-500 mt-1">From products</p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Units Sold</CardTitle>
              <ShoppingCart className="h-4 w-4 text-purple-600" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">
                {analyticsData?.summary?.total_units_sold || 0}
              </div>
              <p className="text-xs text-gray-500 mt-1">{period}</p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Avg Basket</CardTitle>
              <ShoppingBag className="h-4 w-4 text-orange-600" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">
                {analyticsData?.summary?.avg_basket_size?.toFixed(1) || "0"}
              </div>
              <p className="text-xs text-gray-500 mt-1">Items per order</p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Dead Stock</CardTitle>
              <AlertTriangle className="h-4 w-4 text-red-600" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-red-600">
                {analyticsData?.performance_breakdown?.dead_stock || 0}
              </div>
              <p className="text-xs text-gray-500 mt-1">Not selling</p>
            </CardContent>
          </Card>
        </div>
      )}

      {/* Filters */}
      <div className="flex gap-4">
        <div className="flex-1">
          <Input
            placeholder="Search products..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full"
          />
        </div>
        <Select value={period} onValueChange={setPeriod}>
          <SelectTrigger className="w-40">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="7d">Last 7 days</SelectItem>
            <SelectItem value="30d">Last 30 days</SelectItem>
            <SelectItem value="90d">Last 90 days</SelectItem>
            <SelectItem value="all">All time</SelectItem>
          </SelectContent>
        </Select>
        <Select
          value={selectedCategory || "all"}
          onValueChange={(value) => setSelectedCategory(value === "all" ? undefined : value)}
        >
          <SelectTrigger className="w-48">
            <SelectValue placeholder="All Categories" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Categories</SelectItem>
            {categories.map((cat: string) => (
              <SelectItem key={cat} value={cat}>
                {cat}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
        <Select value={sortBy} onValueChange={(value: any) => setSortBy(value)}>
          <SelectTrigger className="w-40">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="units_sold">Most Sold</SelectItem>
            <SelectItem value="revenue">Highest Revenue</SelectItem>
            <SelectItem value="last_sold">Recently Sold</SelectItem>
          </SelectContent>
        </Select>
      </div>

      {/* Main Content */}
      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <TabsList className="grid w-full grid-cols-4">
          <TabsTrigger value="overview">Overview</TabsTrigger>
          <TabsTrigger value="performance">Performance</TabsTrigger>
          <TabsTrigger value="categories">Categories</TabsTrigger>
          <TabsTrigger value="insights">Insights</TabsTrigger>
        </TabsList>

        {/* Overview Tab */}
        <TabsContent value="overview" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Products Performance</CardTitle>
              <CardDescription>
                Real-time ranking based on actual sales ({period})
              </CardDescription>
            </CardHeader>
            <CardContent>
              {isLoading ? (
                <div className="flex items-center justify-center py-8">
                  <Loader2 className="h-8 w-8 animate-spin text-gray-400" />
                </div>
              ) : filteredProducts.length > 0 ? (
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead className="w-12">Rank</TableHead>
                      <TableHead>Product</TableHead>
                      <TableHead>Category</TableHead>
                      <TableHead className="text-right">Units Sold</TableHead>
                      <TableHead className="text-right">Revenue</TableHead>
                      <TableHead className="text-right">Avg Price</TableHead>
                      <TableHead>Performance</TableHead>
                      <TableHead>Last Sold</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {filteredProducts.map((product: any) => {
                      const badge = getPerformanceBadge(product.performance);
                      const BadgeIcon = badge.icon;
                      const CategoryIcon = getCategoryIcon(product.category);

                      return (
                        <TableRow key={product.product_id || product.pos_article_id}>
                          <TableCell>
                            <div className="flex items-center justify-center">
                              {product.rank <= 3 && product.units_sold > 0 ? (
                                <div className={`flex items-center justify-center w-8 h-8 rounded-full ${
                                  product.rank === 1 ? "bg-yellow-100 text-yellow-700" :
                                  product.rank === 2 ? "bg-gray-100 text-gray-700" :
                                  "bg-orange-100 text-orange-700"
                                }`}>
                                  <span className="font-bold text-sm">{product.rank}</span>
                                </div>
                              ) : (
                                <span className="text-gray-600">{product.rank}</span>
                              )}
                            </div>
                          </TableCell>
                          <TableCell>
                            <div>
                              <div className="font-medium">{product.name}</div>
                              {product.pos_article_id && (
                                <div className="text-xs text-gray-500">
                                  ID: {product.pos_article_id}
                                </div>
                              )}
                            </div>
                          </TableCell>
                          <TableCell>
                            <div className="flex items-center gap-2">
                              <CategoryIcon className="h-4 w-4 text-gray-400" />
                              <span className="text-sm">{product.category || "Other"}</span>
                            </div>
                          </TableCell>
                          <TableCell className="text-right font-semibold">
                            {product.units_sold}
                          </TableCell>
                          <TableCell className="text-right font-semibold">
                            {formatCurrency(product.total_revenue)}
                          </TableCell>
                          <TableCell className="text-right">
                            {product.avg_price > 0 ? formatCurrency(product.avg_price) : "-"}
                          </TableCell>
                          <TableCell>
                            <div className={`flex items-center gap-1 p-1 px-2 rounded-lg ${badge.bg} w-fit`}>
                              <BadgeIcon className={`h-3 w-3 ${badge.color}`} />
                              <span className={`text-xs font-medium ${badge.color}`}>
                                {badge.name}
                              </span>
                            </div>
                          </TableCell>
                          <TableCell>
                            {product.last_sold ? (
                              <div className="text-sm">
                                {product.days_since_last_sale === 0
                                  ? "Today"
                                  : product.days_since_last_sale === 1
                                  ? "Yesterday"
                                  : `${product.days_since_last_sale}d ago`}
                              </div>
                            ) : (
                              <span className="text-gray-400">Never</span>
                            )}
                          </TableCell>
                        </TableRow>
                      );
                    })}
                  </TableBody>
                </Table>
              ) : (
                <div className="text-center py-8 text-gray-500">
                  No products found for the selected criteria
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        {/* Performance Tab */}
        <TabsContent value="performance" className="space-y-6">
          {analyticsData?.performance_breakdown && (
            <div className="grid grid-cols-1 lg:grid-cols-5 gap-4">
              <Card>
                <CardHeader className="pb-3">
                  <CardTitle className="text-sm flex items-center gap-2">
                    <Flame className="h-4 w-4 text-green-600" />
                    Best Sellers
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="text-3xl font-bold text-green-600">
                    {analyticsData.performance_breakdown.best_sellers}
                  </div>
                  <p className="text-xs text-gray-500 mt-1">2x above average</p>
                </CardContent>
              </Card>

              <Card>
                <CardHeader className="pb-3">
                  <CardTitle className="text-sm flex items-center gap-2">
                    <Star className="h-4 w-4 text-blue-600" />
                    Good Performers
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="text-3xl font-bold text-blue-600">
                    {analyticsData.performance_breakdown.good_performers}
                  </div>
                  <p className="text-xs text-gray-500 mt-1">Above average</p>
                </CardContent>
              </Card>

              <Card>
                <CardHeader className="pb-3">
                  <CardTitle className="text-sm flex items-center gap-2">
                    <Activity className="h-4 w-4 text-gray-600" />
                    Average
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="text-3xl font-bold text-gray-600">
                    {analyticsData.performance_breakdown.average_performers}
                  </div>
                  <p className="text-xs text-gray-500 mt-1">Normal sales</p>
                </CardContent>
              </Card>

              <Card>
                <CardHeader className="pb-3">
                  <CardTitle className="text-sm flex items-center gap-2">
                    <Clock className="h-4 w-4 text-yellow-600" />
                    Slow Movers
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="text-3xl font-bold text-yellow-600">
                    {analyticsData.performance_breakdown.slow_movers}
                  </div>
                  <p className="text-xs text-gray-500 mt-1">Below average</p>
                </CardContent>
              </Card>

              <Card>
                <CardHeader className="pb-3">
                  <CardTitle className="text-sm flex items-center gap-2">
                    <AlertTriangle className="h-4 w-4 text-red-600" />
                    Dead Stock
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="text-3xl font-bold text-red-600">
                    {analyticsData.performance_breakdown.dead_stock}
                  </div>
                  <p className="text-xs text-gray-500 mt-1">Not selling</p>
                </CardContent>
              </Card>
            </div>
          )}

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Top 5 Best Sellers */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Flame className="h-5 w-5 text-green-600" />
                  Top 5 Best Sellers
                </CardTitle>
                <CardDescription>Driving your revenue</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  {analyticsData?.products?.slice(0, 5).map((product: any, index: number) => (
                    <div
                      key={product.product_id}
                      className="flex items-center justify-between p-3 bg-green-50 rounded-lg"
                    >
                      <div className="flex items-center gap-3">
                        <div className="flex items-center justify-center w-8 h-8 rounded-full bg-green-100 text-green-600 font-semibold text-sm">
                          {index + 1}
                        </div>
                        <div>
                          <div className="font-medium">{product.name}</div>
                          <div className="text-xs text-gray-500">
                            {product.units_sold} units • {formatCurrency(product.total_revenue)}
                          </div>
                        </div>
                      </div>
                      <TrendingUp className="h-4 w-4 text-green-600" />
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>

            {/* Dead Stock Alert */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2 text-red-600">
                  <AlertTriangle className="h-5 w-5" />
                  Dead Stock Alert
                </CardTitle>
                <CardDescription>
                  Products not selling in {period}
                </CardDescription>
              </CardHeader>
              <CardContent>
                {analyticsData?.products && (
                  <div className="space-y-3">
                    {analyticsData.products
                      .filter((p: any) => p.performance === "dead_stock")
                      .slice(0, 5)
                      .map((product: any) => (
                        <div
                          key={product.product_id}
                          className="flex items-center justify-between p-3 bg-red-50 rounded-lg"
                        >
                          <div>
                            <div className="font-medium">{product.name}</div>
                            <div className="text-xs text-red-600">
                              {product.last_sold
                                ? `Last sold: ${product.days_since_last_sale} days ago`
                                : "Never sold"}
                            </div>
                          </div>
                          <XCircle className="h-4 w-4 text-red-600" />
                        </div>
                      ))}
                  </div>
                )}
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        {/* Categories Tab */}
        <TabsContent value="categories" className="space-y-6">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Category Revenue Distribution */}
            <Card>
              <CardHeader>
                <CardTitle>Revenue by Category</CardTitle>
                <CardDescription>Distribution of sales revenue</CardDescription>
              </CardHeader>
              <CardContent>
                {categoryChartData.length > 0 ? (
                  <ResponsiveContainer width="100%" height={300}>
                    <PieChart>
                      <Pie
                        data={categoryChartData}
                        cx="50%"
                        cy="50%"
                        outerRadius={100}
                        fill="#8884d8"
                        dataKey="value"
                        label={({ name, percent }) =>
                          `${name} ${(percent * 100).toFixed(0)}%`
                        }
                      >
                        {categoryChartData.map((entry, index) => (
                          <Cell key={`cell-${index}`} fill={entry.color} />
                        ))}
                      </Pie>
                      <Tooltip formatter={(value) => formatCurrency(Number(value))} />
                    </PieChart>
                  </ResponsiveContainer>
                ) : (
                  <div className="h-[300px] flex items-center justify-center text-gray-400">
                    No category data available
                  </div>
                )}
              </CardContent>
            </Card>

            {/* Category Performance Table */}
            <Card>
              <CardHeader>
                <CardTitle>Category Performance</CardTitle>
                <CardDescription>Sales metrics by category</CardDescription>
              </CardHeader>
              <CardContent>
                {analyticsData?.categories && analyticsData.categories.length > 0 ? (
                  <div className="space-y-3">
                    {analyticsData.categories.map((category: any) => {
                      const CategoryIcon = getCategoryIcon(category.category);
                      const percentage = analyticsData.summary?.total_revenue
                        ? (category.revenue / analyticsData.summary.total_revenue) * 100
                        : 0;

                      return (
                        <div key={category.category} className="space-y-2">
                          <div className="flex items-center justify-between">
                            <div className="flex items-center gap-2">
                              <CategoryIcon className="h-4 w-4 text-gray-600" />
                              <span className="font-medium">{category.category || "Other"}</span>
                            </div>
                            <div className="text-right">
                              <div className="font-semibold">
                                {formatCurrency(category.revenue)}
                              </div>
                              <div className="text-xs text-gray-500">
                                {category.units_sold} units • {category.product_count} products
                              </div>
                            </div>
                          </div>
                          <Progress value={percentage} className="h-2" />
                        </div>
                      );
                    })}
                  </div>
                ) : (
                  <div className="text-center py-8 text-gray-500">
                    No category data available
                  </div>
                )}
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        {/* Insights Tab */}
        <TabsContent value="insights" className="space-y-6">
          {/* Frequently Bought Together */}
          {analyticsData?.frequently_bought_together && analyticsData.frequently_bought_together.length > 0 && (
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Layers className="h-5 w-5" />
                  Frequently Bought Together
                </CardTitle>
                <CardDescription>
                  Create bundles based on customer behavior
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                  {analyticsData.frequently_bought_together.slice(0, 6).map((combo: any, index: number) => (
                    <div key={index} className="p-4 border rounded-lg">
                      <div className="flex items-center justify-between mb-2">
                        <Badge variant="secondary">{combo.frequency}x</Badge>
                        <ShoppingBag className="h-4 w-4 text-gray-400" />
                      </div>
                      <div className="space-y-1">
                        <div className="font-medium">{combo.product_1}</div>
                        <div className="text-sm text-gray-500">+</div>
                        <div className="font-medium">{combo.product_2}</div>
                      </div>
                      <Button variant="outline" size="sm" className="w-full mt-3">
                        Create Bundle
                      </Button>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          )}

          {/* Actionable Insights */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Target className="h-5 w-5" />
                  Action Items
                </CardTitle>
                <CardDescription>
                  Data-driven recommendations
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                {analyticsData?.performance_breakdown?.dead_stock > 0 && (
                  <Alert>
                    <AlertTriangle className="h-4 w-4" />
                    <AlertTitle>Clear Dead Stock</AlertTitle>
                    <AlertDescription>
                      You have {analyticsData.performance_breakdown.dead_stock} products not selling.
                      Consider discounts or removal from menu.
                    </AlertDescription>
                  </Alert>
                )}

                {analyticsData?.products?.[0] && (
                  <Alert className="border-green-200 bg-green-50">
                    <TrendingUp className="h-4 w-4 text-green-600" />
                    <AlertTitle className="text-green-900">Promote Best Sellers</AlertTitle>
                    <AlertDescription className="text-green-700">
                      "{analyticsData.products[0].name}" is your top performer with{" "}
                      {analyticsData.products[0].units_sold} units sold.
                      Feature it prominently.
                    </AlertDescription>
                  </Alert>
                )}

                {analyticsData?.summary?.avg_basket_size && analyticsData.summary.avg_basket_size < 2 && (
                  <Alert className="border-blue-200 bg-blue-50">
                    <Info className="h-4 w-4 text-blue-600" />
                    <AlertTitle className="text-blue-900">Increase Basket Size</AlertTitle>
                    <AlertDescription className="text-blue-700">
                      Average basket is only {analyticsData.summary.avg_basket_size.toFixed(1)} items.
                      Use bundles and upsells to increase.
                    </AlertDescription>
                  </Alert>
                )}
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Zap className="h-5 w-5" />
                  Quick Wins
                </CardTitle>
                <CardDescription>
                  Actions you can take today
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-3">
                <div className="p-4 bg-purple-50 rounded-lg">
                  <div className="flex items-center gap-2 mb-2">
                    <Award className="h-4 w-4 text-purple-600" />
                    <span className="font-semibold text-purple-900">
                      Best Seller Badge
                    </span>
                  </div>
                  <p className="text-sm text-purple-700">
                    Add "Best Seller" badges to your top 5 products on menu/display
                  </p>
                </div>

                <div className="p-4 bg-orange-50 rounded-lg">
                  <div className="flex items-center gap-2 mb-2">
                    <Package className="h-4 w-4 text-orange-600" />
                    <span className="font-semibold text-orange-900">
                      Bundle Deals
                    </span>
                  </div>
                  <p className="text-sm text-orange-700">
                    Create combos from frequently bought together items
                  </p>
                </div>

                <div className="p-4 bg-blue-50 rounded-lg">
                  <div className="flex items-center gap-2 mb-2">
                    <Clock className="h-4 w-4 text-blue-600" />
                    <span className="font-semibold text-blue-900">
                      Time-Limited Offers
                    </span>
                  </div>
                  <p className="text-sm text-blue-700">
                    Offer discounts on slow movers during off-peak hours
                  </p>
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>
      </Tabs>
    </div>
  );
}